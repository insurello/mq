export interface Headers {
    [key: string]: unknown;
}
export interface Request {
    properties: {
        headers: Headers;
        type?: string;
        replyTo?: string;
    };
    body: any;
    queue?: string;
    type?: string;
    ack: () => void;
    nack: () => void;
    reject: () => void;
    reply: (data: unknown, options?: ReplyOptions) => void;
}
export interface ReplyOptions {
    more?: boolean;
    replyType?: string;
    contentType?: string;
    headers?: Headers;
}
export declare const createDurationLogInfo: (request: Request, message: string, startTimestamp: number, endTimestamp: number) => {
    message: string;
    properties: {
        type?: string | undefined;
        replyTo?: string | undefined;
        headers: {
            [key: string]: unknown;
        };
    };
    queue: string | undefined;
    duration: number;
};
