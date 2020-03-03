"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBasicLogInfo = (request, message) => ({
    message,
    properties: request.properties,
    queue: request.queue
});
//# sourceMappingURL=request.js.map