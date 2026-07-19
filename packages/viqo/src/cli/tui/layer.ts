import { run as runTui, type TuiInput } from "@viqo-ai/tui"
import { Global } from "@viqo-ai/core/global"
import { AppNodeBuilder } from "@viqo-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
