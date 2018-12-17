import { Request } from "./request";
export interface ErrorDescription {
    error: string;
    error_description: string;
}
export declare const errorHandler: (req: Request, logger: import("winston").Logger) => (err?: unknown) => void;
