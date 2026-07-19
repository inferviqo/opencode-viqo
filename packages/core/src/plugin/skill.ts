/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeOpencodeContent from "./skill/customize-viqo.md" with { type: "text" }

export const CustomizeOpencodeContent = customizeOpencodeContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-viqo",
            description:
              "Use ONLY when the user is editing or creating viqo's own configuration: viqo.json, viqo.jsonc, files under .viqo/, or files under ~/.config/viqo/. Also use when creating or fixing viqo agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring viqo itself.",
            location: AbsolutePath.make("/builtin/customize-viqo.md"),
            content: CustomizeOpencodeContent,
          }),
        }),
      )
    })
  }),
})
