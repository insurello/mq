import * as t from "io-ts";
import { Logger } from "./logger";
import { Request } from "./request";
declare type Callback<T, C> = (data: T, context: C) => PromiseLike<void> | void;
export declare type Events<T, C> = SingleCallbackStyle<T, C> | EventCallbackStyle<T, C>;
interface SingleCallbackStyle<T, C> {
    type: t.Type<T>;
    init: (options: any) => PromiseLike<C> | C;
    event: Callback<T, C>;
    logger?: Logger;
}
interface EventCallbackStyle<T, C> {
    type: t.Type<T>;
    init: (options: any) => PromiseLike<C> | C;
    event?: string;
    events: {
        [key: string]: Callback<T, C>;
    };
    logger?: Logger;
}
export declare const events: <T, C = any>(desc: Events<T, C>) => (options: any) => (req: Request) => Promise<void>;
export {};
