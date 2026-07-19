import { AgentV2 } from "@viqo-ai/core/agent"
import { AISDK } from "@viqo-ai/core/aisdk"
import { Catalog } from "@viqo-ai/core/catalog"
import { CommandV2 } from "@viqo-ai/core/command"
import { Credential } from "@viqo-ai/core/credential"
import { AppNodeBuilder } from "@viqo-ai/core/effect/app-node-builder"
import { LayerNodePlatform } from "@viqo-ai/core/effect/app-node-platform"
import { LayerNode } from "@viqo-ai/core/effect/layer-node"
import { EventV2 } from "@viqo-ai/core/event"
import { FileSystem } from "@viqo-ai/core/filesystem"
import { FSUtil } from "@viqo-ai/core/fs-util"
import { Integration } from "@viqo-ai/core/integration"
import { Location } from "@viqo-ai/core/location"
import { Npm } from "@viqo-ai/core/npm"
import { PluginV2 } from "@viqo-ai/core/plugin"
import { Reference } from "@viqo-ai/core/reference"
import { SkillV2 } from "@viqo-ai/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
