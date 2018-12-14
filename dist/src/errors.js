"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const isError = (err) => err &&
    typeof err === "object" &&
    err.error !== undefined &&
    typeof err.error === "string" &&
    err.error_description !== undefined &&
    typeof err.error_description === "string";
exports.errorHandler = (req, logger) => (err) => {
    if (err instanceof Error) {
        req.nack();
        logger.error(err.stack ? err.stack : err.message, req.properties);
    }
    else if (isError(err)) {
        response_1.response(req)(err, { "x-error": err.error });
        logger.warn(`${err}`, req.properties);
    }
    else if (typeof err === "string") {
        response_1.response(req)({ error: err }, { "x-error": err });
        logger.warn(`${err}`, req.properties);
    }
    else {
        req.reject();
        logger.verbose("rejected", req.properties);
    }
};
//# sourceMappingURL=errors.js.map