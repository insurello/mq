# MQ

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
  init: options => ({}),
  event: "event",
  events: {
    claim: (commit: Commit, context) => Promise.resolve(),
    closed: (commit: Commit, context) => Promise.resolve(),
    rejected: (commit: Commit, context) => Promise.resolve()
  }
});
```

### Service

A generic RPC service that responds with a reply message of the specified type. Supports request authorization.

```typescript
import * as mq from "mq";
import * as t from "io-ts";

const helloWorld = mq.service({
  type: t.type({ message: t.string }),
  init: options => ({}),
  authorized: (headers, context) => Promise.resolve(context),
  forbidden: (headers, context) => Promise.resolve(context),
  response: context => Promise.resolve({ message: "Hello World!" })
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
