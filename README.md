# This repo is no longer in use and has been archived
# MQ

A declarative abstraction layer for writing event handlers.

## Features

- Three basic event handler types (events, service and resource) for different use cases.
- A declarative callback/promise based API that hides potentially complex details like error handling and serializations.
- Statically typed validation of input/output messages using the `io-ts` library.
- Not tied to any specific back-end and can be used with any queue based protocol (currently only supports AMQP).
- Ideal for building event sourced micro-services.

## Handler types

### Events

A generic event handler that reacts to incoming messages of the specified type.

```typescript
import * as mq from "mq";
import * as t from "io-ts";

mq.events({
  type: t.any,
  init: options => ({}),
  event: (data, context) => {
    switch (data.event) {
      case "claim": return Promise.resolve();
      default: return Promise.reject();
    }
});
```

If the `event` field is a string instead of a callback function it is interpreted as a field in the message body that contains the event name. The handler will then trigger a callback with the corresponding name instead of the generic callback. If no matching handler is found the message will be rejected.

```typescript
mq.events({
  type: commit.decoder,
  init: (options) => ({}),
  event: "event",
  events: {
    claim: (commit: Commit, context) => Promise.resolve(),
    closed: (commit: Commit, context) => Promise.resolve(),
    rejected: (commit: Commit, context) => Promise.resolve(),
  },
});
```

### Service

A generic RPC service that responds with a reply message of the specified type. Supports request authorization.

```typescript
import * as mq from "mq";
import * as t from "io-ts";

const helloWorld = mq.service({
  type: t.type({ message: t.string }),
  init: (options) => ({}),
  authorized: (headers, context) => Promise.resolve(context),
  forbidden: (headers, context) => Promise.resolve(context),
  response: (context) => Promise.resolve({ message: "Hello World!" }),
});
```

### Resource

A generic resource representation that can update the resource with the incoming message body and respond with a reply message of the specified type. Supports request authorization.

```typescript
import * as mq from "mq";
import * as t from "io-ts";

const helloName = mq.resource({
  type: [t.string, t.type({ message: t.string })],
  init: options => ({}),
  authorized: (headers, context) => Promise.resolve(context),
  exists: (headers, context) => Promise.resolve(context),
  forbidden: (headers, context) => Promise.resolve(context),
  update: (data, context) => Promise.resolve({ name: data }),
  response: context => Promise.resolve({ message: `Hello ${context.name}!`` })
});
```

## Nack delay

By default, all handler types sleep for 30 seconds before nacking, to reduce the number of errors reported.

You can pass for example `defaultNackDelayMs: 10000` to `mq.events`, `mq.service` and `mq.resource` to change the default nack delay.

You can also set `.nackDelayMs = 0` on specific `Error`s to set a different delay for a certain error.
