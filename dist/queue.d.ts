/// <reference types="node" />
declare type Logger = (message?: any, ...optionalParams: any[]) => void;
export declare const setLogger: (newLogger: Logger) => void;
export declare type Worker = (message: any, headers: Headers) => PromiseLike<any> | void;
export interface WorkerOptions {
    acknowledgeOnReceipt: boolean;
}
export interface Headers {
    [key: string]: any;
}
export declare const isConnected: () => boolean;
export declare const connect: () => void;
export declare const enqueue: (routingKey: string, data: {} | Buffer, headers?: Headers | undefined) => void;
export declare const worker: (routingKey: string, func: Worker, options?: WorkerOptions | undefined) => void;
export declare const rpc: (routingKey: string, data?: {} | Buffer | undefined, headers?: Headers | undefined, ttl?: number | undefined) => Promise<any>;
export declare const publish: (routingKey: string, data: {} | Buffer, headers?: Headers | undefined) => void;
export declare const subscribe: (topic: string, func: Worker, options?: WorkerOptions | undefined) => void;
export {};
