import { Context, Effect } from "effect"

export interface Interface {
  readonly run: Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@viqo/InstanceBootstrap") {}

export * as InstanceBootstrap from "./bootstrap-service"
