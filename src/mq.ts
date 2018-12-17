import * as t from "io-ts";
import * as _events from "./events";
import * as _resource from "./resource";
import * as _service from "./service";

export type Events<T, C> = _events.Events<T, C>;
export type Resource<T, O, C> = _resource.Resource<T, O, C>;
export type Service<O, C> = _service.Service<O, C>;

export const type = t.type;
export const events = _events.events;
export const resource = _resource.resource;
export const service = _service.service;
