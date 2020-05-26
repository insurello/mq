import { Logger } from "./logger";
import { Request } from "./request";
import { response } from "./response";

export interface ErrorDescription {
  error: string;
  error_description: string;
}

const isError = (err: any): err is ErrorDescription =>
  err &&
  typeof err === "object" &&
  (err as ErrorDescription).error !== undefined &&
  typeof (err as ErrorDescription).error === "string" &&
  (err as ErrorDescription).error_description !== undefined &&
  typeof (err as ErrorDescription).error_description === "string";

const delay = (sleepMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, sleepMs));

type CustomError = Error & { nackDelayMs?: unknown };

export const errorHandler = (
  req: Request,
  logger: Logger,
  defaultDelayMs: number = 30000
) => (err?: unknown): Promise<void> => {
  const requestInfo = {
    type: req.type,
    queue: req.queue,
    properties: req.properties,
  };

  if (err instanceof Error) {
    const delayMs =
      typeof (err as CustomError).nackDelayMs === "number"
        ? ((err as CustomError).nackDelayMs as number)
        : defaultDelayMs;
    logger.error(err.stack ? err.stack : err.message, {
      ...requestInfo,
      delayMs,
    });
    return delay(delayMs).then(() => req.nack());
  } else if (isError(err)) {
    response(req)(err, { "x-error": err.error });
    logger.warn(JSON.stringify(err), requestInfo);
    return Promise.resolve();
  } else if (typeof err === "string") {
    response(req)({ error: err }, { "x-error": err });
    logger.warn(JSON.stringify(err), requestInfo);
    return Promise.resolve();
  } else {
    req.reject();
    logger.verbose("rejected", requestInfo);
    return Promise.resolve();
  }
};
