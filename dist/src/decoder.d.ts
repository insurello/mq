import * as t from "io-ts";
export declare const decode: <T>(decoder: t.Type<T, T, unknown>, data: unknown) => Promise<T>;
