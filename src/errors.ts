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

export const errorHandler = ({
  req,
  logger,
  startTimestamp,
  defaultNackDelayMs = 30000,
}: {
  req: Request;
  logger: Logger;
  startTimestamp: number;
  defaultNackDelayMs?: number;
}) => (err?: unknown): Promise<void> => {
  if (err instanceof Error) {
    const delayMs =
      typeof (err as CustomError).nackDelayMs === "number"
        ? ((err as CustomError).nackDelayMs as number)
        : defaultNackDelayMs;
    logger.error(
      createDurationInfo(
        req,
        err.stack ? err.stack : err.message,
        startTimestamp,
        Date.now(),
        delayMs
      )
    );
    return delay(delayMs).then(() => req.nack());
  } else if (isError(err)) {
    response(req)(err, { "x-error": err.error });
    logger.warn(
      createDurationInfo(req, JSON.stringify(err), startTimestamp, Date.now())
    );
    return Promise.resolve();
  } else if (typeof err === "string") {
    response(req)({ error: err }, { "x-error": err });
    logger.warn(
      createDurationInfo(req, JSON.stringify(err), startTimestamp, Date.now())
    );
    return Promise.resolve();
  } else {
    req.reject();
    logger.verbose(
      createDurationInfo(req, "rejected", startTimestamp, Date.now())
    );
    return Promise.resolve();
  }
};

const createDurationInfo = (
  request: Request,
  message: string,
  startTimestamp: number,
  endTimestamp: number,
  delayMs?: number
) => ({
  message,
  type: request.type,
  properties: request.properties,
  queue: request.queue,
  duration: endTimestamp - startTimestamp,
  delayMs,
});
