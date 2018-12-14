"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const io_ts_reporters_1 = require("io-ts-reporters");
exports.decode = (decoder, data) => {
    const result = decoder.decode(data);
    if (result.isRight()) {
        return Promise.resolve(result.value);
    }
    else {
        const error = io_ts_reporters_1.reporter(result).join("\n");
        return Promise.reject(new Error(error));
    }
};
//# sourceMappingURL=decoder.js.map