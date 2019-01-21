import * as t from "io-ts";
export declare const decode: <A, O>(decoder: t.Type<A, O, unknown>, data: unknown) => Promise<A>;
