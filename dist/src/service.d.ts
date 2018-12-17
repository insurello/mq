import * as t from "io-ts";
import { Logger } from "./logger";
import { Headers, Request } from "./request";
export interface Service<O, C> {
    type: t.Type<O>;
    init: (options: any) => PromiseLike<C> | C;
    authorized: (headers: Headers, context: C) => PromiseLike<C> | C;
    forbidden: (headers: Headers, context: C) => PromiseLike<C> | C;
    response: (context: C) => PromiseLike<O> | O;
    logger?: Logger;
}
export declare const service: <O = unknown, C = any>(desc: Service<O, C>) => (options: any) => (req: Request) => Promise<void>;
