import * as t from "io-ts";
import { decode } from "./decoder";
import { errorHandler } from "./errors";
import { Logger, logger } from "./logger";
import { Headers, Request } from "./request";
import { response } from "./response";

interface Service<O, C> {
  type: t.Type<O>;
  init: (options: any) => PromiseLike<C> | C;
  authorized: (headers: Headers, context: C) => PromiseLike<C> | C;
  forbidden: (headers: Headers, context: C) => PromiseLike<C> | C;
  response: (context: C) => PromiseLike<O> | O;
  logger?: Logger;
}

export const service = <O = t.mixed, C = any>(desc: Service<O, C>) => {
  const _logger = desc.logger ? desc.logger : logger;
  return (options: any) => (req: Request) => {
    return Promise.resolve(desc.init(options))
      .then(context => desc.authorized(req.properties.headers, context))
      .then(context => desc.forbidden(req.properties.headers, context))
      .then(context => desc.response(context))
      .then(result => decode(desc.type, result))
      .then(response(req))
      .then(a => a, errorHandler(req, _logger));
  };
};
