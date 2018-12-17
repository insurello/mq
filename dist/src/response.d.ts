import { Headers, Request } from "./request";
export declare const response: (req: Request) => <T>(data: T, headers?: Headers | undefined) => void;
