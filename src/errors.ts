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

export const errorHandler = (req: Request, logger: Logger) => (
  err?: unknown
) => {
  const errorReq = {
    type: req.type,
    queue: req.queue,
    properties: req.properties
  };

  if (err instanceof Error) {
    req.nack();
    logger.error(err.stack ? err.stack : err.message, errorReq);
  } else if (isError(err)) {
    response(req)(err, { "x-error": err.error });
    logger.warn(`${err}`, errorReq);
  } else if (typeof err === "string") {
    response(req)({ error: err }, { "x-error": err });
    logger.warn(`${err}`, errorReq);
  } else {
    req.reject();
    logger.verbose("rejected", errorReq);
  }
};
