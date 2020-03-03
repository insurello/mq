import * as t from "io-ts";
import { decode } from "./decoder";
import { errorHandler } from "./errors";
import { Logger, logger } from "./logger";
import { createDurationLogInfo, Request } from "./request";

const defaultEventField = "event";

type Callback<T, C> = (data: T, context: C) => PromiseLike<void> | void;

export type Events<T, C, O> =
  | SingleCallbackStyle<T, C, O>
  | EventCallbackStyle<T, C, O>;

interface SingleCallbackStyle<T, C, O> {
  type: t.Type<T, O>;
  init: (options: any) => PromiseLike<C> | C;
  event: Callback<T, C>;
  logger?: Logger;
}

interface EventCallbackStyle<T, C, O> {
  type: t.Type<T, O>;
  init: (options: any) => PromiseLike<C> | C;
  event?: string;
  events: {
    [key: string]: Callback<T, C>;
  };
  logger?: Logger;
}

export const events = <T, C = any, O = T>(desc: Events<T, C, O>) => {
  const _logger = desc.logger ? desc.logger : logger;
  return (options: any) => (req: Request) => {
    const durationStart: number = Date.now();
    return Promise.resolve(desc.init(options))
      .then(context =>
        decode(desc.type, req.body).then(data =>
          isEventCallbackStyle(desc)
            ? Promise.resolve(eventHandler(desc, req, data, context))
            : Promise.resolve(desc.event(data, context))
        )
      )
      .then(() => req.ack())
      .then(success => {
        _logger.info(
          createDurationLogInfo(
            req,
            "Event processed",
            durationStart,
            Date.now()
          )
        );
        return success;
      }, errorHandler(req, _logger));
  };
};

const eventHandler = <T, C, O>(
  desc: EventCallbackStyle<T, C, O>,
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

const isEventCallbackStyle = <T, C, O>(
  desc: Events<T, C, O>
): desc is EventCallbackStyle<T, C, O> =>
  (typeof desc.event === "string" || desc.event === undefined) &&
  (desc as EventCallbackStyle<T, C, O>).events !== undefined;
