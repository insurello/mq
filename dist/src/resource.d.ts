import * as t from "io-ts";
import { Logger } from "./logger";
import { Headers, Request } from "./request";
export interface Resource<T, O, C> {
    type: [t.Type<T>, t.Type<O>];
    init: (options: any) => PromiseLike<C> | C;
    authorized: (headers: Headers, context: C) => PromiseLike<C> | C;
    exists: (headers: Headers, context: C) => PromiseLike<C> | C;
    forbidden: (headers: Headers, context: C) => PromiseLike<C> | C;
    update: (data: T, context: C) => PromiseLike<C> | C;
    response: (context: C) => PromiseLike<O> | O;
    logger?: Logger;
}
export declare const resource: <T, O = unknown, C = any>(desc: Resource<T, O, C>) => (options: any) => (req: Request) => Promise<void>;
