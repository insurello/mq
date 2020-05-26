"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDurationLogInfo = void 0;
exports.createDurationLogInfo = (request, message, startTimestamp, endTimestamp) => {
    const _a = request.properties.headers, { authorization } = _a, filteredHeaders = __rest(_a, ["authorization"]);
    const _b = request.properties, { headers } = _b, filteredProperties = __rest(_b, ["headers"]);
    const duration = endTimestamp - startTimestamp;
    return {
        message,
        properties: Object.assign({ headers: filteredHeaders }, filteredProperties),
        queue: request.queue,
        duration,
    };
};
//# sourceMappingURL=request.js.map