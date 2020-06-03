"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("./response");
const isError = (err) => err &&
    typeof err === "object" &&
    err.error !== undefined &&
    typeof err.error === "string" &&
    err.error_description !== undefined &&
    typeof err.error_description === "string";
const delay = (sleepMs) => new Promise((resolve) => setTimeout(resolve, sleepMs));
exports.errorHandler = ({ req, logger, startTimestamp, defaultNackDelayMs = 30000, }) => (err) => {
    if (err instanceof Error) {
        const delayMs = typeof err.nackDelayMs === "number"
            ? err.nackDelayMs
            : defaultNackDelayMs;
        logger.error(createDurationInfo(req, err.stack ? err.stack : err.message, startTimestamp, Date.now(), delayMs));
        return delay(delayMs).then(() => req.nack());
    }
    else if (isError(err)) {
        response_1.response(req)(err, { "x-error": err.error });
        logger.warn(createDurationInfo(req, JSON.stringify(err), startTimestamp, Date.now()));
        return Promise.resolve();
    }
    else if (typeof err === "string") {
        response_1.response(req)({ error: err }, { "x-error": err });
        logger.warn(createDurationInfo(req, JSON.stringify(err), startTimestamp, Date.now()));
        return Promise.resolve();
    }
    else {
        req.reject();
        logger.verbose(createDurationInfo(req, "rejected", startTimestamp, Date.now()));
        return Promise.resolve();
    }
};
const createDurationInfo = (request, message, startTimestamp, endTimestamp, delayMs) => ({
    message,
    type: request.type,
    properties: request.properties,
    queue: request.queue,
    duration: endTimestamp - startTimestamp,
    delayMs,
});
//# sourceMappingURL=errors.js.map