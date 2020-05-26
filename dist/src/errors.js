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
exports.errorHandler = (req, logger, defaultDelayMs = 30000) => (err) => {
    const requestInfo = {
        type: req.type,
        queue: req.queue,
        properties: req.properties,
    };
    if (err instanceof Error) {
        const delayMs = typeof err.nackDelayMs === "number"
            ? err.nackDelayMs
            : defaultDelayMs;
        logger.error(err.stack ? err.stack : err.message, Object.assign(Object.assign({}, requestInfo), { delayMs }));
        return delay(delayMs).then(() => req.nack());
    }
    else if (isError(err)) {
        response_1.response(req)(err, { "x-error": err.error });
        logger.warn(JSON.stringify(err), requestInfo);
        return Promise.resolve();
    }
    else if (typeof err === "string") {
        response_1.response(req)({ error: err }, { "x-error": err });
        logger.warn(JSON.stringify(err), requestInfo);
        return Promise.resolve();
    }
    else {
        req.reject();
        logger.verbose("rejected", requestInfo);
        return Promise.resolve();
    }
};
//# sourceMappingURL=errors.js.map