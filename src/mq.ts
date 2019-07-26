import * as t from "io-ts";
import * as _events from "./events";
import * as _reporters from "./io-ts-reporters";
import * as _resource from "./resource";
import * as _service from "./service";

export type Events<T, C, O> = _events.Events<T, C, O>;
export type Resource<T, U, C, TO, UO> = _resource.Resource<T, U, C, TO, UO>;
export type Service<T, C, O> = _service.Service<T, C, O>;

export const type = t.type;
export const events = _events.events;
export const resource = _resource.resource;
export const service = _service.service;
export const reporter = _reporters.reporter;
