import { Effect } from "effect"
import { Integration } from "../../integration"
import { ModelV2 } from "../../model"
import { ProviderV2 } from "../../provider"
import { define } from "../internal"

const providerID = ProviderV2.ID.make("inferviqo")
const integrationID = Integration.ID.make("inferviqo")
const baseURL = "https://api.inferviqo.com"

const models = [
  { id: "accounts/inferviqo/models/glm-5p2", name: "GLM 5.2" },
  { id: "accounts/inferviqo/models/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
  { id: "accounts/inferviqo/models/gpt-oss-20b", name: "GPT OSS 20B" },
] as const

export const InferviqoPlugin = define({
  id: "inferviqo",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.integration.transform((draft) => {
      draft.update(integrationID, (integration) => {
        integration.name = "Inferviqo"
      })
      draft.method.update({
        integrationID,
        method: { type: "key", label: "API key" },
      })
      draft.method.update({
        integrationID,
        method: { type: "env", names: ["INFERVIQO_API_KEY"] },
      })
    })

    yield* ctx.catalog.transform((catalog) => {
      catalog.provider.update(providerID, (provider) => {
        provider.name = "Inferviqo"
        provider.integrationID = integrationID
        provider.api = {
          type: "aisdk",
          package: "@ai-sdk/openai-compatible",
          url: baseURL,
        }
      })

      for (const model of models) {
        catalog.model.update(providerID, ModelV2.ID.make(model.id), (draft) => {
          draft.name = model.name
          draft.api = {
            id: ModelV2.ID.make(model.id),
            type: "aisdk",
            package: "@ai-sdk/openai-compatible",
            url: baseURL,
          }
          draft.capabilities = {
            tools: true,
            input: ["text", "image"],
            output: ["text"],
          }
          draft.enabled = true
        })
      }
    })
  }),
})
