import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@viqo-ai/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~viqo/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~viqo/WorkspaceRef", {
  defaultValue: () => undefined,
})
