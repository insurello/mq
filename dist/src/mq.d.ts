import * as t from "io-ts";
import * as _events from "./events";
import * as _resource from "./resource";
import * as _service from "./service";
export declare type Events<T, C, O> = _events.Events<T, C, O>;
export declare type Resource<T, U, C, TO, UO> = _resource.Resource<T, U, C, TO, UO>;
export declare type Service<T, C, O> = _service.Service<T, C, O>;
export declare const type: <P extends t.Props>(props: P, name?: string | undefined) => t.TypeC<P>;
export declare const events: <T, C = any, O = T>(desc: _events.Events<T, C, O>) => (options: any) => (req: import("./request").Request) => Promise<void>;
export declare const resource: <T, U = unknown, C = any, TO = T, UO = U>(desc: _resource.Resource<T, U, C, TO, UO>) => (options: any) => (req: import("./request").Request) => Promise<void>;
export declare const service: <T = unknown, C = any, O = T>(desc: _service.Service<T, C, O>) => (options: any) => (req: import("./request").Request) => Promise<void>;