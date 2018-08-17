"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amqp = require("amqp");
const async_mutex_1 = require("async-mutex");
const uuidv4 = require("uuid/v4");
let logger = console.log;
exports.setLogger = (newLogger) => {
    logger = newLogger;
};
const callbacks = {};
const workers = {};
const subscribers = {};
const fifoQueue = [];
let replyToQueue;
let connected = false;
exports.isConnected = () => connected;
exports.connect = function () {
    let interval;
    const mutex = new async_mutex_1.Mutex();
    const connection = amqp.createConnection({
        url: process.env.AMQP_URL
    });
    connection.on("error", function (err) {
        if (err.stack) {
            logger(err.stack);
        }
        else {
            logger(err);
        }
    });
    connection.on("close", function (hadError) {
        logger("Connection to AMQP broker was closed.", hadError ? "Reconnecting..." : "");
        connected = false;
    });
    connection.on("close", function () {
        replyToQueue = undefined;
    });
    connection.on("close", function () {
        clearInterval(interval);
    });
    connection.on("ready", function () {
        connected = true;
        logger("Connection to AMQP broker is ready.");
    });
    connection.on("ready", function () {
        logger("Subscribing to reply queue.");
        subscribeReplyTo();
    });
    connection.on("ready", function () {
        for (const routingKey in workers) {
            if (workers.hasOwnProperty(routingKey)) {
                workers[routingKey].forEach((_worker) => {
                    subscribeWorker(routingKey, _worker.func, _worker.options);
                });
            }
        }
    });
    connection.on("ready", function () {
        for (const topic in subscribers) {
            if (subscribers.hasOwnProperty(topic)) {
                subscribers[topic].forEach((_worker) => {
                    subscribeTopic(topic, _worker.func, _worker.options);
                });
            }
        }
    });
    connection.on("ready", function () {
        interval = setInterval(drainQueue, 100);
    });
    const subscribeReplyTo = function () {
        const q = connection.queue("", { exclusive: true }, function (info) {
            replyToQueue = info.name;
            q.subscribe({ exclusive: true }, function (message, _headers, deliveryInfo, _ack) {
                for (const correlationId in callbacks) {
                    if (correlationId === deliveryInfo.correlationId) {
                        if (callbacks.hasOwnProperty(correlationId)) {
                            try {
                                callbacks[correlationId].call(undefined, message);
                            }
                            catch (error) {
                                logger(error);
                            }
                        }
                    }
                }
            });
        });
    };
    const subscribeWorker = function (routingKey, func, options) {
        const q = connection.queue(routingKey, { autoDelete: false, durable: true }, function (_info) {
            q.subscribe({ ack: true, prefetchCount: 1 }, function (message, headers, deliveryInfo, ack) {
                messageHandler(func, message, headers, deliveryInfo, ack, options);
            });
        });
    };
    const subscribeTopic = function (topic, func, options) {
        const q = connection.queue(topic, { autoDelete: false, durable: true }, function (_info) {
            q.bind("amq.topic", topic);
            q.subscribe({ ack: true, prefetchCount: 1 }, function (message, headers, deliveryInfo, ack) {
                messageHandler(func, message, headers, deliveryInfo, ack, options);
            });
        });
    };
    const messageHandler = function (workerFunc, message, headers, deliveryInfo, ack, options) {
        if (options.acknowledgeOnReceipt) {
            acknowledgeHandler.call(ack);
        }
        const acknowledge = options.acknowledgeOnReceipt ?
            ((error) => { logger(error); }) :
            acknowledgeHandler.bind(ack);
        const replyTo = deliveryInfo.replyTo;
        const correlationId = deliveryInfo.correlationId;
        try {
            const result = workerFunc(message, headers);
            if (result && result.then) {
                result.then((value) => {
                    sendReply(replyTo, correlationId, value, headers);
                    acknowledge();
                }, acknowledge);
            }
            else {
                acknowledge();
            }
        }
        catch (error) {
            acknowledge(error);
        }
    };
    const acknowledgeHandler = function (error) {
        if (error) {
            this.reject(false);
            logger("MSG", this.routingKey, "(" + this.exchange + ")", "err");
            logger(error);
        }
        else {
            this.acknowledge(false);
            logger("MSG", this.routingKey, "(" + this.exchange + ")", "ok");
        }
    };
    const sendReply = function (replyTo, correlationId, value, headers) {
        if (replyTo && value) {
            const options = {
                contentType: "application/json",
                headers: headers ? headers : {},
                correlationId: correlationId ? correlationId : uuidv4()
            };
            connection.publish(replyTo, value, options, function (err, msg) {
                if (err) {
                    logger(msg);
                }
            });
        }
    };
    const drainQueue = function () {
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
    const removeEmptyOptions = (obj) => {
        Object.keys(obj).forEach(key => (obj[key] && typeof obj[key] === "object") &&
            removeEmptyOptions(obj[key]) ||
            (obj[key] === undefined) && delete obj[key]);
        return obj;
    };
    const internalPublish = function (msg) {
        return new Promise((resolve, reject) => {
            const exchange = connection
                .exchange(msg.exchangeName, { confirm: true }, function () {
                const options = removeEmptyOptions(msg.options);
                exchange.publish(msg.routingKey, msg.data, options, function (failed, errorMessage) {
                    if (failed) {
                        reject(new Error(errorMessage));
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    };
};
exports.enqueue = function (routingKey, data, headers) {
    const options = {
        deliveryMode: 2,
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
exports.worker = function (routingKey, func, options) {
    workers[routingKey] = workers[routingKey] || [];
    workers[routingKey].push({
        func,
        options: options ? options : { acknowledgeOnReceipt: false }
    });
};
exports.rpc = function (routingKey, data, headers, ttl) {
    if (replyToQueue) {
        const _ttl = ttl || 60 * 1000;
        const correlationId = uuidv4();
        const options = {
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
                }
                else {
                    resolve(msg);
                }
            };
            fifoQueue.push({
                exchangeName: "",
                routingKey,
                data,
                options
            });
        });
    }
    else {
        return Promise.reject(new Error("Not connected to broker"));
    }
};
exports.publish = function (routingKey, data, headers) {
    const options = {
        deliveryMode: 2,
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
exports.subscribe = function (topic, func, options) {
    subscribers[topic] = subscribers[topic] || [];
    subscribers[topic].push({
        func,
        options: options ? options : { acknowledgeOnReceipt: false }
    });
};
