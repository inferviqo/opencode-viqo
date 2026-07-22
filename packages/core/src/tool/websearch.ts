export * as WebSearchTool from "./websearch"

import { ToolFailure } from "@viqo-ai/llm"
import { Context, Duration, Effect, Layer, Schema } from "effect"
import { HttpClient, HttpClientRequest } from "effect/unstable/http"
import { makeLocationNode } from "../effect/app-node"
import { LayerNodePlatform } from "../effect/app-node-platform"
import { InstallationVersion } from "../installation/version"
import { PositiveInt } from "../schema"
import { PermissionV2 } from "../permission"
import { Tool } from "./tool"
import { Tools } from "./tools"
import { collectBoundedResponseBody } from "./http-body"
import { ToolRegistry } from "./registry"

export const name = "websearch"
export const NO_RESULTS = "No search results found. Please try a different query."
export const MAX_NUM_RESULTS = 20
export const MAX_CONTEXT_CHARACTERS = 50_000
export const MAX_RESPONSE_BYTES = 256 * 1024

/**
 * Local websearch tool. Always calls the Inferviqo gateway (`POST /v1/websearch`),
 * which proxies to private SearXNG. Distinct from provider-hosted web_search tools.
 */
export const description = `Search the web for current information beyond knowledge cutoff.

Uses the Inferviqo websearch gateway. Optional controls support result count.

The current year is ${new Date().getFullYear()}. Use this year when searching for recent information or current events.`

export const Input = Schema.Struct({
  query: Schema.String.annotate({ description: "Websearch query" }),
  numResults: Schema.optional(PositiveInt.check(Schema.isLessThanOrEqualTo(MAX_NUM_RESULTS))).annotate({
    description: `Number of search results to return (default: 8, maximum: ${MAX_NUM_RESULTS})`,
  }),
  livecrawl: Schema.optional(Schema.Literals(["fallback", "preferred"])).annotate({
    description:
      "Live crawl mode - 'fallback': use live crawling as backup if cached unavailable, 'preferred': prioritize live crawling (default: 'fallback')",
  }),
  type: Schema.optional(Schema.Literals(["auto", "fast", "deep"])).annotate({
    description: "Search type - 'auto': balanced search (default), 'fast': quick results, 'deep': comprehensive search",
  }),
  contextMaxCharacters: Schema.optional(PositiveInt.check(Schema.isLessThanOrEqualTo(MAX_CONTEXT_CHARACTERS))).annotate(
    {
      description: `Maximum characters for context string optimized for models (default: 10000, maximum: ${MAX_CONTEXT_CHARACTERS})`,
    },
  ),
})

export const Provider = Schema.Literals(["inferviqo"])
export type Provider = typeof Provider.Type

export interface Config {
  readonly inferviqoApiKey?: string
  readonly inferviqoBaseUrl?: string
}

export class ConfigService extends Context.Service<ConfigService, Config>()("@viqo/v2/WebSearchConfig") {}

export const defaultConfigLayer = Layer.sync(ConfigService, () =>
  ConfigService.of({
    inferviqoApiKey: process.env.VIQO_API_KEY || process.env.VIQO_GATEWAY_API_KEY,
    inferviqoBaseUrl: process.env.VIQO_API_BASE_URL,
  }),
)

export const configNode = makeLocationNode({ service: ConfigService, layer: defaultConfigLayer, deps: [] })

/** V2 websearch always uses the Inferviqo gateway. */
export function selectProvider(_sessionID?: string): Provider {
  return "inferviqo"
}

export function inferviqoWebSearchUrl(baseUrl?: string) {
  const root = (baseUrl || "https://api.inferviqo.com").trim().replace(/\/+$/, "")
  if (root.endsWith("/v1")) return `${root}/websearch`
  return `${root}/v1/websearch`
}

const InferviqoResponse = Schema.Struct({
  text: Schema.optional(Schema.String),
  query: Schema.optional(Schema.String),
  results: Schema.optional(
    Schema.Array(
      Schema.Struct({
        title: Schema.optional(Schema.String),
        url: Schema.optional(Schema.String),
        content: Schema.optional(Schema.String),
        engine: Schema.optional(Schema.String),
      }),
    ),
  ),
})

function formatResults(
  query: string,
  results: ReadonlyArray<{ title?: string; url?: string; content?: string; engine?: string }>,
) {
  if (results.length === 0) return `No search results found for "${query}".`
  const blocks = results.map((item, index) => {
    const lines = [`${index + 1}. ${(item.title || "").trim() || "(untitled)"}`]
    if (item.url?.trim()) lines.push(`   URL: ${item.url.trim()}`)
    if (item.engine?.trim()) lines.push(`   Engine: ${item.engine.trim()}`)
    if (item.content?.trim()) lines.push(`   ${item.content.trim()}`)
    return lines.join("\n")
  })
  return `Search results for "${query}":\n\n${blocks.join("\n\n")}`
}

const callInferviqo = (
  http: HttpClient.HttpClient,
  config: Config,
  input: typeof Input.Type,
) =>
  Effect.gen(function* () {
    const apiKey = config.inferviqoApiKey?.trim()
    if (!apiKey) {
      return yield* Effect.fail(
        new Error("Inferviqo websearch requires VIQO_API_KEY or VIQO_GATEWAY_API_KEY"),
      )
    }

    const request = yield* HttpClientRequest.post(inferviqoWebSearchUrl(config.inferviqoBaseUrl)).pipe(
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeaders({
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
        "User-Agent": `viqo/${InstallationVersion}`,
      }),
      HttpClientRequest.bodyJson({
        query: input.query,
        numResults: input.numResults || 8,
      }),
    )

    const response = yield* HttpClient.filterStatusOk(http)
      .execute(request)
      .pipe(
        Effect.timeoutOrElse({
          duration: Duration.seconds(30),
          orElse: () => Effect.fail(new Error("inferviqo websearch request timed out")),
        }),
      )

    const body = yield* collectBoundedResponseBody(
      response,
      MAX_RESPONSE_BYTES,
      () => new Error(`inferviqo websearch response exceeded ${MAX_RESPONSE_BYTES} bytes`),
    )
    const decoded = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(InferviqoResponse))(body.toString("utf8"))
    if (decoded.text?.trim()) return decoded.text
    return formatResults(input.query, decoded.results ?? [])
  })

const Output = Schema.Struct({
  provider: Provider,
  text: Schema.String,
})

const layer = Layer.effectDiscard(
  Effect.gen(function* () {
    const tools = yield* Tools.Service
    const http = yield* HttpClient.HttpClient
    const config = yield* ConfigService
    const permission = yield* PermissionV2.Service

    yield* tools
      .register({
        [name]: Tool.make({
          description,
          input: Input,
          output: Output,
          toModelOutput: ({ output }) => [{ type: "text", text: output.text }],
          execute: (input, context) => {
            const provider = selectProvider(context.sessionID)
            return Effect.gen(function* () {
              yield* permission.assert({
                action: name,
                resources: [input.query],
                save: ["*"],
                metadata: { ...input, provider },
                sessionID: context.sessionID,
                agent: context.agent,
                source: { type: "tool", messageID: context.assistantMessageID, callID: context.toolCallID },
              })

              const text = yield* callInferviqo(http, config, input)
              return {
                provider,
                text: text ?? NO_RESULTS,
              }
            }).pipe(Effect.mapError(() => new ToolFailure({ message: `Unable to search the web for ${input.query}` })))
          },
        }),
      })
      .pipe(Effect.orDie)
  }),
)

export const node = makeLocationNode({
  name: "tool/websearch",
  layer,
  deps: [ToolRegistry.node, PermissionV2.node, LayerNodePlatform.httpClient, configNode],
})
