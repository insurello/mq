import * as t from "io-ts";
import { decode } from "./decoder";
import { errorHandler } from "./errors";
import { Logger, logger } from "./logger";
import { Request } from "./request";

const defaultEventField = "event";

type Callback<T, C> = (data: T, context: C) => PromiseLike<void> | void;

type Events<T, C> = SingleCallbackStyle<T, C> | EventCallbackStyle<T, C>;

interface SingleCallbackStyle<T, C> {
  type: t.Type<T>;
  init: (options: any) => PromiseLike<C> | C;
  event: Callback<T, C>;
  logger?: Logger;
}

interface EventCallbackStyle<T, C> {
  type: t.Type<T>;
  init: (options: any) => PromiseLike<C> | C;
  event?: string;
  events: {
    [key: string]: Callback<T, C>;
  };
  logger?: Logger;
}

export const events = <T, C = any>(desc: Events<T, C>) => {
  const _logger = desc.logger ? desc.logger : logger;
  return (options: any) => (req: Request) => {
    return Promise.resolve(desc.init(options))
      .then(context =>
        decode(desc.type, req.body).then(data =>
          isEventCallbackStyle(desc)
            ? Promise.resolve(eventHandler(desc, req, data, context))
            : Promise.resolve(desc.event(data, context))
        )
      )
      .then(() => req.ack())
      .then(a => a, errorHandler(req, _logger));
  };
};

const eventHandler = <T, C>(
  desc: EventCallbackStyle<T, C>,
  req: Request,
  data: T,
  context: C
) =>
  (typeof desc.event === "string" || desc.event === undefined) &&
  req.body[desc.event || defaultEventField] &&
  desc.events &&
  desc.events[req.body[desc.event || defaultEventField]] &&
  typeof desc.events[req.body[desc.event || defaultEventField]] === "function"
    ? desc.events[req.body[desc.event || defaultEventField]](data, context)
    : Promise.reject();

const isEventCallbackStyle = <T, C>(
  desc: Events<T, C>
): desc is EventCallbackStyle<T, C> =>
  (typeof desc.event === "string" || desc.event === undefined) &&
  (desc as EventCallbackStyle<T, C>).events !== undefined;
