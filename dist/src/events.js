"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
const decoder_1 = require("./decoder");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const request_1 = require("./request");
const defaultEventField = "event";
exports.events = (desc) => {
    const _logger = desc.logger ? desc.logger : logger_1.logger;
    return (options) => (req) => {
        const durationStart = Date.now();
        return Promise.resolve(desc.init(options))
            .then((context) => decoder_1.decode(desc.type, req.body).then((data) => isEventCallbackStyle(desc)
            ? Promise.resolve(eventHandler(desc, req, data, context))
            : Promise.resolve(desc.event(data, context))))
            .then(() => req.ack())
            .then((success) => {
            _logger.info(request_1.createDurationLogInfo(req, "Event processed", durationStart, Date.now()));
            return success;
        }, errors_1.errorHandler(req, _logger));
    };
};
const eventHandler = (desc, req, data, context) => (typeof desc.event === "string" || desc.event === undefined) &&
    req.body[desc.event || defaultEventField] &&
    desc.events &&
    desc.events[req.body[desc.event || defaultEventField]] &&
    typeof desc.events[req.body[desc.event || defaultEventField]] === "function"
    ? desc.events[req.body[desc.event || defaultEventField]](data, context)
    : Promise.reject();
const isEventCallbackStyle = (desc) => (typeof desc.event === "string" || desc.event === undefined) &&
    desc.events !== undefined;
//# sourceMappingURL=events.js.map