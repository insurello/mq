import * as t from "io-ts";
import { decode } from "./decoder";
import { errorHandler } from "./errors";
import { Logger, logger } from "./logger";
import { createDurationLogInfo, Headers, Request } from "./request";
import { response } from "./response";

export interface Service<T, C, O> {
  type: t.Type<T, O>;
  init: (options: any) => PromiseLike<C> | C;
  authorized: (headers: Headers, context: C) => PromiseLike<C> | C;
  forbidden: (headers: Headers, context: C) => PromiseLike<C> | C;
  response: (context: C) => PromiseLike<T> | T;
  logger?: Logger;
}

export const service = <T = t.mixed, C = any, O = T>(
  desc: Service<T, C, O>
) => {
  const _logger = desc.logger ? desc.logger : logger;
  return (options: any) => (req: Request) => {
    const durationStart = Date.now();
    return Promise.resolve(desc.init(options))
      .then(context => desc.authorized(req.properties.headers, context))
      .then(context => desc.forbidden(req.properties.headers, context))
      .then(context => desc.response(context))
      .then(result => decode(desc.type, result))
      .then(response(req))
      .then(success => {
        _logger.info(
          createDurationLogInfo(req, "Response sent", durationStart, Date.now())
        );
        return success;
      }, errorHandler(req, _logger));
  };
};
