import * as amqp from "amqp";
import { Mutex } from "async-mutex";
import * as uuidv4 from "uuid/v4";

const defaultTimeout = 30 * 1000; // 30 seconds

type Logger =
  (message?: any, ...optionalParams: any[]) => void;

let logger: Logger = console.log;

export const setLogger = (newLogger: Logger) => {
  logger = newLogger;
};

const red = (str: string): string =>
  process.env.NODE_ENV !== "production" ? `\x1b[31m${str}\x1b[0m` : str;

const green = (str: string): string =>
  process.env.NODE_ENV !== "production" ? `\x1b[32m${str}\x1b[0m` : str;

const startTime = (): [number, number] =>
  process.hrtime();

const elapsed = (start: [number, number]): string =>
  `${(process.hrtime(start)[1] / 1000000).toFixed(3)} ms`;

export type Worker =
  (message: any, headers: Headers) => PromiseLike<any> | void;

export interface WorkerOptions {
  acknowledgeOnReceipt: boolean;
}

export interface Headers {
  [key: string]: any
}

interface Queues {
  [name: string]: Array<{ func: Worker, options: WorkerOptions }>
}

interface Callbacks {
  [correlationId: string]: (msg: any, err?: Error) => void;
}

interface Message {
  exchangeName: string;
  routingKey: string;
  data: {} | Buffer;
  options: amqp.ExchangePublishOptions;
}

const callbacks: Callbacks = {};
const workers: Queues = {};
const subscribers: Queues = {};
const fifoQueue: Message[] = [];

let replyToQueue: string | undefined;

let connected: boolean = false;
export const isConnected = () => connected;

export const connect = function() {
  let interval: NodeJS.Timer;
  const mutex: Mutex = new Mutex();

  const connection: amqp.AMQPClient =
    amqp.createConnection({
      url: process.env.AMQP_URL
    });

  connection.on("error", function(err) {
    if (err.stack) {
      logger(err.stack);
    } else {
      logger(err);
    }
  });

  connection.on("close", function(hadError: boolean) {
    logger("Connection to AMQP broker was closed.",
      hadError ? "Reconnecting..." : "");
    connected = false;
  });

  connection.on("close", function() {
    replyToQueue = undefined;
  });

  connection.on("close", function() {
    clearInterval(interval);
  });

  connection.on("ready", function() {
    logger("Connection to AMQP broker is ready.");
  });

  connection.on("ready", function() {
    logger("Subscribing to reply queue.");
    subscribeReplyTo();
  });

  connection.on("ready", function() {
    for (const routingKey in workers) {
      if (workers.hasOwnProperty(routingKey)) {
        workers[routingKey].forEach((_worker) => {
          subscribeWorker(routingKey, _worker.func, _worker.options);
        });
      }
    }
  });

  connection.on("ready", function() {
    for (const topic in subscribers) {
      if (subscribers.hasOwnProperty(topic)) {
        subscribers[topic].forEach((_worker) => {
          subscribeTopic(topic, _worker.func, _worker.options);
        });
      }
    }
  });

  connection.on("ready", function() {
    interval = setInterval(drainQueue, 100);
  });

  const subscribeReplyTo = function() {
    const q = connection.queue("", { exclusive: true },
      function(info: amqp.QueueCallback) {
        replyToQueue = info.name;
        connected = true;
        q.subscribe({ exclusive: true },
          function(message, _headers, deliveryInfo, _ack) {
            for (const correlationId in callbacks) {
              if (correlationId === (deliveryInfo as any).correlationId) {
                if (callbacks.hasOwnProperty(correlationId)) {
                  try {
                    callbacks[correlationId].call(undefined, message);
                  } catch (error) {
                    logger(error);
                  }
                }
              }
            }
          });
    });
  };

  const subscribeWorker =
      function(routingKey: string, func: Worker, options: WorkerOptions) {
    const q = connection.queue(routingKey, { autoDelete: false, durable: true },
      function(_info: amqp.QueueCallback) {
        q.subscribe({ ack: true, prefetchCount: 1 },
          function(message, headers, deliveryInfo, ack) {
            const start = startTime();
            messageHandler(func, message, headers, deliveryInfo, ack, options)
              .then(() =>
                logger("MSG", ack.routingKey, green("OK"), elapsed(start)))
              .catch((err) =>
                logger("MSG", ack.routingKey, red("ERR"), elapsed(start), err));
          });
    });
  };

  const subscribeTopic =
      function(topic: string, func: Worker, options: WorkerOptions) {
    const q = connection.queue(topic, { autoDelete: false, durable: true },
      function(_info: amqp.QueueCallback) {
        q.bind("amq.topic", topic);
        q.subscribe({ ack: true, prefetchCount: 1 },
          function(message, headers, deliveryInfo, ack) {
            const start = startTime();
            messageHandler(func, message, headers, deliveryInfo, ack, options)
              .then(() =>
                logger("SUB", ack.routingKey, green("OK"), elapsed(start)))
              .catch((err) =>
                logger("SUB", ack.routingKey, red("ERR"), elapsed(start), err));
          });
    });
  };

  const messageHandler = function(
      workerFunc: Worker,
      message: any,
      headers: Headers,
      deliveryInfo: amqp.DeliveryInfo,
      ack: amqp.Ack,
      options: WorkerOptions): Promise<void> {
    if (options.acknowledgeOnReceipt) {
      acknowledgeHandler.call(ack);
    }
    const acknowledge = options.acknowledgeOnReceipt ?
      (() => { /* nop */ }) : acknowledgeHandler.bind(ack);
    const replyTo = (deliveryInfo as any).replyTo;
    const correlationId = (deliveryInfo as any).correlationId;
    try {
      const result = workerFunc(message, headers);
      if (result && result.then) {
        return Promise.resolve(result)
          .then((value) => {
            sendReply(replyTo, correlationId, value, headers);
            acknowledge();
          })
          .catch((err) => {
            acknowledge(err);
            return Promise.reject(err);
          });
      } else {
        acknowledge();
        return Promise.resolve();
      }
    } catch (error) {
      acknowledge(error);
      return Promise.reject(error);
    }
  };

  const acknowledgeHandler = function(this: amqp.Ack, error?: Error) {
    if (error) {
      this.reject(false);
    } else {
      this.acknowledge(false);
    }
  };

  const sendReply = function(
      replyTo: string,
      correlationId: string,
      value: any,
      headers: Headers) {
    if (replyTo && value) {
      const options: amqp.ExchangePublishOptions = {
        contentType: "application/json",
        headers: headers ? headers : {},
        correlationId: correlationId ? correlationId : uuidv4()
      };
      connection.publish(replyTo, value, options,
        function(err?: boolean, msg?: string) {
          if (err) {
            logger(msg);
          }
        });
    }
  };

  const drainQueue = function() {
    if (mutex.isLocked()) {
      return;
    }
    mutex
      .acquire()
      .then((release) => {
        while (fifoQueue.length > 0) {
          const msg = fifoQueue.shift();
          if (msg) {
            internalPublish(msg)
              .catch(logger);
          }
        }
        release();
      });
  };

  const removeEmptyOptions = (obj: any) => {
    Object.keys(obj).forEach(key =>
      (obj[key] && typeof obj[key] === "object") &&
        removeEmptyOptions(obj[key]) ||
          (obj[key] === undefined) && delete obj[key]
    );
    return obj;
  };

  const internalPublish = function(msg: Message) {
    return new Promise((resolve, reject) => {
      const exchange = connection
        .exchange(msg.exchangeName, { confirm: true }, function() {
          const options = removeEmptyOptions(msg.options);
          exchange.publish(msg.routingKey, msg.data, options,
            function(failed, errorMessage) {
              if (failed) {
                reject(new Error(errorMessage));
              } else {
                resolve();
              }
            });
        });
    });
  };
};

// == RPC WORKERS ==

export const enqueue = function(
    routingKey: string,
    data: {} | Buffer,
    headers?: Headers): void {
  const options: amqp.ExchangePublishOptions = {
    deliveryMode: 2, // Persistent
    mandatory: true,
    contentType: "application/json",
    headers: headers ? headers : {}
  };
  fifoQueue.push({
    exchangeName: "",
    routingKey,
    data,
    options
  });
};

export const worker =
    function(routingKey: string, func: Worker, options?: WorkerOptions) {
  workers[routingKey] = workers[routingKey] || [];
  workers[routingKey].push({
    func,
    options: options ? options : { acknowledgeOnReceipt: true }
  });
};

// == RPC CALL ==

export const rpc = function(
    routingKey: string,
    data?: {} | Buffer,
    headers?: Headers,
    ttl?: number): Promise<any> {
  if (replyToQueue) {
    const _data = data || {};
    const _ttl = ttl || defaultTimeout;
    const correlationId = uuidv4();
    const options: amqp.ExchangePublishOptions = {
      contentType: "application/json",
      replyTo: replyToQueue,
      correlationId,
      expiration: _ttl.toString(),
      headers: headers ? headers : {}
    };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        delete callbacks[correlationId];
        reject(new Error("Timeout"));
      }, _ttl);
      callbacks[correlationId] = (msg, err) => {
        clearTimeout(timeout);
        delete callbacks[correlationId];
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      };
      fifoQueue.push({
        exchangeName: "",
        routingKey,
        data: _data,
        options
      });
    });
  } else {
    return Promise.reject(new Error("Not connected to broker"));
  }
};

// == TOPIC PUB/SUB ==

export const publish = function(
    routingKey: string,
    data: {} | Buffer,
    headers?: Headers): void {
  const options: amqp.ExchangePublishOptions = {
    deliveryMode: 2, // Persistent
    contentType: "application/json",
    headers: headers ? headers : {}
  };
  fifoQueue.push({
    exchangeName: "amq.topic",
    routingKey,
    data,
    options
  });
};

export const subscribe =
    function(topic: string, func: Worker, options?: WorkerOptions) {
  subscribers[topic] = subscribers[topic] || [];
  subscribers[topic].push({
    func,
    options: options ? options : { acknowledgeOnReceipt: true }
  });
};
