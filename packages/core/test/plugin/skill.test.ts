import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { AppNodeBuilder } from "@viqo-ai/core/effect/app-node-builder"
import { SkillPlugin } from "@viqo-ai/core/plugin/skill"
import { SkillV2 } from "@viqo-ai/core/skill"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const it = testEffect(AppNodeBuilder.build(SkillV2.node))

describe("SkillPlugin.Plugin", () => {
  it.effect("registers the built-in customize-viqo skill", () =>
    Effect.gen(function* () {
      const skill = yield* SkillV2.Service
      yield* SkillPlugin.Plugin.effect(host({ skill: { ...skill, reload: skill.reload } }))

      expect(yield* skill.list()).toContainEqual(
        expect.objectContaining({
          name: "customize-viqo",
          description: expect.stringContaining("viqo's own configuration"),
        }),
      )
    }),
  )
})
