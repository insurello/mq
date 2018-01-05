import * as amqp from "amqp";
import { Mutex } from "async-mutex";

export let logger = console.log;

export type Worker =
  (message: any, headers: Headers) => PromiseLike<any> | void;

export interface Headers {
  [key: string]: any
}

interface Queues {
  [name: string]: Worker[]
}

interface Message {
  exchangeName: string;
  routingKey: string;
  data: {} | Buffer;
  headers: Headers;
}

const workers: Queues = {};
const subscribers: Queues = {};
const fifoQueue: Message[] = [];

export let connected: boolean = false;

export const connect = function() {
  let interval: NodeJS.Timer;
  const mutex: Mutex = new Mutex();

  const connection: amqp.AMQPClient =
    amqp.createConnection({
      url: process.env.INSURELLO_AMQP_URL
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
    clearInterval(interval);
  });

  connection.on("ready", function() {
    logger("Connection to AMQP broker is ready.");
    connected = true;
  });

  connection.on("ready", function() {
    for (const routingKey in workers) {
      if (workers.hasOwnProperty(routingKey)) {
        workers[routingKey].forEach((func) => {
          subscribeWorker(routingKey, func);
        });
      }
    }
  });

  connection.on("ready", function() {
    for (const topic in subscribers) {
      if (subscribers.hasOwnProperty(topic)) {
        subscribers[topic].forEach((func) => {
          subscribeTopic(topic, func);
        });
      }
    }
  });

  connection.on("ready", function() {
    interval = setInterval(drainQueue, 100);
  });

  const subscribeWorker = function(routingKey: string, func: Worker) {
    const q = connection.queue(routingKey, { autoDelete: false, durable: true },
      function(_info: amqp.QueueCallback) {
        q.subscribe({ ack: true, prefetchCount: 1 },
          function(message, headers, deliveryInfo, ack) {
            messageHandler(func, message, headers, deliveryInfo, ack);
          });
    });
  };

  const subscribeTopic = function(topic: string, func: Worker) {
    const q = connection.queue(topic, { autoDelete: false, durable: true },
      function(_info: amqp.QueueCallback) {
        q.bind("amq.topic", topic);
        q.subscribe({ ack: true, prefetchCount: 1 },
          function(message, headers, deliveryInfo, ack) {
            messageHandler(func, message, headers, deliveryInfo, ack);
          });
    });
  };

  const messageHandler = function(
      workerFunc: Worker,
      message: any,
      headers: Headers,
      deliveryInfo: amqp.DeliveryInfo,
      ack: amqp.Ack) {
    const acknowledge = acknowledgeHandler.bind(ack);
    const replyTo = (deliveryInfo as any).replyTo;
    try {
      const result = workerFunc(message, headers);
      if (result && result.then) {
        result.then((value) => {
          sendReply(replyTo, value, headers);
          acknowledge();
        }, acknowledge);
      } else {
        acknowledge();
      }
    } catch (error) {
      acknowledge(error);
    }
  };

  const acknowledgeHandler = function(this: amqp.Ack, error?: Error) {
    if (error) {
      this.reject(false);
      logger("MSG", this.routingKey, "(" + this.exchange + ")", "err");
      logger(error);
    } else {
      this.acknowledge(false);
      logger("MSG", this.routingKey, "(" + this.exchange + ")", "ok");
    }
  };

  const sendReply = function(replyTo: string, value: any, headers: Headers) {
    if (replyTo && value) {
      const options: amqp.ExchangePublishOptions = {
        contentType: "application/json",
        headers: headers ? headers : {}
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

  const internalPublish = function(msg: Message) {
    const options: amqp.ExchangePublishOptions = {
      deliveryMode: 2, // Persistent
      contentType: "application/json",
      headers: msg.headers ? msg.headers : {}
    };
    return new Promise((resolve, reject) => {
      const exchange = connection
        .exchange(msg.exchangeName, { confirm: true }, function() {
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
  fifoQueue.push({
    exchangeName: "",
    routingKey,
    data,
    headers: headers ? headers : {}
  });
};

export const worker = function(routingKey: string, func: Worker) {
  workers[routingKey] = workers[routingKey] || [];
  workers[routingKey].push(func);
};

// == TOPIC PUB/SUB ==

export const publish = function(
    routingKey: string,
    data: {} | Buffer,
    headers?: Headers): void {
  fifoQueue.push({
    exchangeName: "amq.topic",
    routingKey,
    data,
    headers: headers ? headers : {}
  });
};

export const subscribe = function(topic: string, func: Worker) {
  subscribers[topic] = subscribers[topic] || [];
  subscribers[topic].push(func);
};
