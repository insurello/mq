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
