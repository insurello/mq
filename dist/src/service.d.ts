import * as t from "io-ts";
import { Logger } from "./logger";
import { Headers, Request } from "./request";
export interface Service<T, C, O> {
    type: t.Type<T, O>;
    init: (options: any) => PromiseLike<C> | C;
    authorized: (headers: Headers, context: C) => PromiseLike<C> | C;
    forbidden: (headers: Headers, context: C) => PromiseLike<C> | C;
    response: (context: C) => PromiseLike<T> | T;
    logger?: Logger;
    defaultNackDelayMs?: number;
}
export declare const service: <T = unknown, C = any, O = T>(desc: Service<T, C, O>) => (options: any) => (req: Request) => Promise<void>;
