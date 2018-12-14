"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTime = () => process.hrtime();
exports.elapsed = (start) => `${(process.hrtime(start)[1] / 1000000).toFixed(3)} ms`;
//# sourceMappingURL=timer.js.map