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
exports.extractDurationLogInfo = (request, message, endTimestamp) => {
    var _a, _b;
    const _c = request.properties.headers, { authorization } = _c, filteredHeaders = __rest(_c, ["authorization"]);
    const _d = request.properties, { headers } = _d, filteredProperties = __rest(_d, ["headers"]);
    const duration = ((_b = (_a = request.metadata) === null || _a === void 0 ? void 0 : _a.duration) === null || _b === void 0 ? void 0 : _b.start) ? endTimestamp - request.metadata.duration.start
        : undefined;
    const logInfo = {
        message,
        properties: Object.assign({ headers: filteredHeaders }, filteredProperties),
        queue: request.queue
    };
    return duration ? Object.assign(Object.assign({}, logInfo), { duration }) : logInfo;
};
exports.initDurationTiming = (request, startTimestamp) => {
    request.metadata = { duration: { start: startTimestamp } };
    return;
};
//# sourceMappingURL=request.js.map