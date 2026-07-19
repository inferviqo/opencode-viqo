# @viqo-ai/sdk-next

Effect-native scoped Viqo host for in-process applications. This transitional package will replace the existing generated `@viqo-ai/sdk` after its consumers migrate.

The SDK executes Server's assembled HTTP router in memory. It opens no listener and performs no network I/O, while preserving the same routing, middleware, handlers, codecs, and errors as the network client.

```ts
import { Viqo } from "@viqo-ai/sdk-next"

const viqo = yield * Viqo.create()
const session = yield * viqo.sessions.get({ sessionID })
```

It also exports `Tool` and exposes local-only `tools.register(...)`, replacing the former `@viqo-ai/core/public` facade. Registration uses Core's host-level `ApplicationTools` service shared by the host's Locations; each Location retains its own `ToolRegistry` for overlay, lookup, and settlement. Closing the owning Effect Scope releases router resources, location services, fibers, and scoped tool registrations.

`sessions.events({ sessionID, after })` replays durable events after the optional aggregate sequence, then emits newly committed durable events. `sessions.interrupt(...)` targets execution owned by this host, and `sessions.message(...)` retrieves one projected Session message.

The same constructor is available as a service Layer:

```ts
const program = Effect.gen(function* () {
  const viqo = yield* Viqo.Service
  return yield* viqo.sessions.get({ sessionID })
})

yield * program.pipe(Effect.provide(Viqo.layer))
```

`Viqo.layer` adapts `Viqo.create()` for dependency injection; it does not define another host implementation.
