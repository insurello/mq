import * as t from "io-ts";
import { Logger } from "./logger";
import { Request } from "./request";
declare type Callback<T, C> = (data: T, context: C) => PromiseLike<void> | void;
export declare type Events<T, C, O> = SingleCallbackStyle<T, C, O> | EventCallbackStyle<T, C, O>;
interface SingleCallbackStyle<T, C, O> {
    type: t.Type<T, O>;
    init: (options: any) => PromiseLike<C> | C;
    event: Callback<T, C>;
    logger?: Logger;
}
interface EventCallbackStyle<T, C, O> {
    type: t.Type<T, O>;
    init: (options: any) => PromiseLike<C> | C;
    event?: string;
    events: {
        [key: string]: Callback<T, C>;
    };
    logger?: Logger;
}
export declare const events: <T, C = any, O = T>(desc: Events<T, C, O>) => (options: any) => (req: Request) => Promise<void>;
export {};
