import * as t from "io-ts";
export declare const formatValidationError: (error: t.ValidationError) => import("fp-ts/lib/Option").Option<string>;
export declare const reporter: <T>(validation: import("fp-ts/lib/Either").Either<t.Errors, T>) => string[];
