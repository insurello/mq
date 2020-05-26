import { Logger } from "./logger";
import { Request } from "./request";
export interface ErrorDescription {
    error: string;
    error_description: string;
}
export declare const errorHandler: (req: Request, logger: Logger, defaultDelayMs?: number) => (err?: unknown) => Promise<void>;
