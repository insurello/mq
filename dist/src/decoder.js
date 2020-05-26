"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
const E = require("fp-ts/lib/Either");
const io_ts_reporters_1 = require("io-ts-reporters");
exports.decode = (decoder, data) => {
    const result = decoder.decode(data);
    if (E.isRight(result)) {
        return Promise.resolve(result.right);
    }
    else {
        const error = io_ts_reporters_1.reporter(result).join("\n");
        return Promise.reject(new Error(error));
    }
};
//# sourceMappingURL=decoder.js.map