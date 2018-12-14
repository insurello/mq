"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.response = (req) => (data, headers) => {
    if (req.properties.replyTo && data) {
        req.reply(data, { contentType: "application/json", headers });
    }
    else {
        req.ack();
    }
};
//# sourceMappingURL=response.js.map