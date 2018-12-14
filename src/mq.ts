import * as t from "io-ts";
import * as _events from "./events";
import * as _resource from "./resource";
import * as _service from "./service";

// export type EventHandler = _events.EventHandler;
// export type Resource = _resource.Resource;
// export type Service = _service.Service;
export const type = t.type;
export const events = _events.events;
export const resource = _resource.resource;
export const service = _service.service;
