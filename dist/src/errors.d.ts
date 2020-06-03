import { Logger } from "./logger";
import { Request } from "./request";
export interface ErrorDescription {
    error: string;
    error_description: string;
}
export declare const errorHandler: ({ req, logger, startTimestamp, defaultNackDelayMs, }: {
    req: Request;
    logger: Logger;
    startTimestamp: number;
    defaultNackDelayMs?: number | undefined;
}) => (err?: unknown) => Promise<void>;
