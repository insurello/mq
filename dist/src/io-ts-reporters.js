"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array = require("fp-ts/lib/Array");
const Either_1 = require("fp-ts/lib/Either");
const Option_1 = require("fp-ts/lib/Option");
const pipeable_1 = require("fp-ts/lib/pipeable");
const jsToString = (value) => value === undefined ? "undefined" : JSON.stringify(value);
exports.formatValidationError = (error) => {
    const path = error.context
        .map(c => c.key)
        .filter(key => key.length > 0)
        .join(".");
    const maybeErrorContext = array.last(error.context);
    return Option_1.option.map(maybeErrorContext, errorContext => {
        const expectedType = errorContext.type.name;
        return (`Expecting ${expectedType}` +
            (path === "" ? "" : ` at ${path}`) +
            ` but instead got: ${jsToString(error.value)}.`);
    });
};
exports.reporter = (validation) => pipeable_1.pipe(validation, Either_1.fold(errors => array.compact(errors.map(exports.formatValidationError)), () => []));
//# sourceMappingURL=io-ts-reporters.js.map