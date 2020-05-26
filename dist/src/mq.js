"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporter = exports.service = exports.resource = exports.events = exports.type = void 0;
const t = require("io-ts");
const _reporters = require("io-ts-reporters");
const _events = require("./events");
const _resource = require("./resource");
const _service = require("./service");
exports.type = t.type;
exports.events = _events.events;
exports.resource = _resource.resource;
exports.service = _service.service;
exports.reporter = _reporters.reporter;
//# sourceMappingURL=mq.js.map