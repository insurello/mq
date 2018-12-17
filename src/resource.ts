import * as t from "io-ts";
import { decode } from "./decoder";
import { errorHandler } from "./errors";
import { Logger, logger } from "./logger";
import { Headers, Request } from "./request";
import { response } from "./response";

export interface Resource<T, O, C> {
  type: [t.Type<T>, t.Type<O>];
  init: (options: any) => PromiseLike<C> | C;
  authorized: (headers: Headers, context: C) => PromiseLike<C> | C;
  exists: (headers: Headers, context: C) => PromiseLike<C> | C;
  forbidden: (headers: Headers, context: C) => PromiseLike<C> | C;
  update: (data: T, context: C) => PromiseLike<C> | C;
  response: (context: C) => PromiseLike<O> | O;
  logger?: Logger;
}

export const resource = <T, O = t.mixed, C = any>(desc: Resource<T, O, C>) => {
  const _logger = desc.logger ? desc.logger : logger;
  return (options: any) => (req: Request) => {
    return Promise.resolve(desc.init(options))
      .then(context => desc.authorized(req.properties.headers, context))
      .then(context => desc.exists(req.properties.headers, context))
      .then(context => desc.forbidden(req.properties.headers, context))
      .then(context =>
        decode(desc.type[0], req.body).then(data =>
          Promise.resolve(desc.update(data, context))
            .then(_context => desc.response(_context))
            .then(result => decode(desc.type[1], result))
            .then(response(req))
        )
      )
      .then(a => a, errorHandler(req, _logger));
  };
};
