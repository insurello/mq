"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decoder_1 = require("./decoder");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const request_1 = require("./request");
const response_1 = require("./response");
exports.resource = (desc) => {
    const _logger = desc.logger ? desc.logger : logger_1.logger;
    return (options) => (req) => {
        _logger.info(request_1.extractBasicLogInfo(req, "Request recevied"));
        return Promise.resolve(desc.init(options))
            .then(context => desc.authorized(req.properties.headers, context))
            .then(context => desc.exists(req.properties.headers, context))
            .then(context => desc.forbidden(req.properties.headers, context))
            .then(context => decoder_1.decode(desc.type[0], req.body).then(data => Promise.resolve(desc.update(data, context))
            .then(_context => desc.response(_context))
            .then(result => decoder_1.decode(desc.type[1], result))
            .then(response_1.response(req))))
            .then(success => {
            _logger.info(request_1.extractBasicLogInfo(req, "Response sent"));
            return success;
        }, errors_1.errorHandler(req, _logger));
    };
};
//# sourceMappingURL=resource.js.map