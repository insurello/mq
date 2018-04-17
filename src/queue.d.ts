/// <reference types="node" />
export declare let logger: {
    (message?: any, ...optionalParams: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
export declare type Worker = (message: any, headers: Headers) => PromiseLike<any> | void;
export interface Headers {
    [key: string]: any;
}
export declare const isConnected: () => boolean;
export declare const connect: () => void;
export declare const enqueue: (routingKey: string, data: {} | Buffer, headers?: Headers | undefined) => void;
export declare const worker: (routingKey: string, func: Worker) => void;
export declare const rpc: (routingKey: string, data: {} | Buffer, headers?: Headers | undefined, ttl?: number | undefined) => PromiseLike<any>;
export declare const publish: (routingKey: string, data: {} | Buffer, headers?: Headers | undefined) => void;
export declare const subscribe: (topic: string, func: Worker) => void;
