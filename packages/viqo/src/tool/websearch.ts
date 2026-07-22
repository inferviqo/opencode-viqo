import { Effect, Schema } from "effect"
import { HttpClient, HttpClientRequest } from "effect/unstable/http"
import * as Tool from "./tool"
import * as McpWebSearch from "./mcp-websearch"
import DESCRIPTION from "./websearch.txt"
import { checksum } from "@viqo-ai/core/util/encode"
import { InstallationVersion } from "@viqo-ai/core/installation/version"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { Auth } from "@/auth"

export const Parameters = Schema.Struct({
  query: Schema.String.annotate({ description: "Websearch query" }),
  numResults: Schema.optional(Schema.Number).annotate({
    description: "Number of search results to return (default: 8)",
  }),
  livecrawl: Schema.optional(Schema.Literals(["fallback", "preferred"])).annotate({
    description:
      "Live crawl mode - 'fallback': use live crawling as backup if cached content unavailable, 'preferred': prioritize live crawling (default: 'fallback')",
  }),
  type: Schema.optional(Schema.Literals(["auto", "fast", "deep"])).annotate({
    description: "Search type - 'auto': balanced search (default), 'fast': quick results, 'deep': comprehensive search",
  }),
  contextMaxCharacters: Schema.optional(Schema.Number).annotate({
    description: "Maximum characters for context string optimized for LLMs (default: 10000)",
  }),
})

const WebSearchProviderSchema = Schema.Literals(["inferviqo", "exa", "parallel"])
export type WebSearchProvider = Schema.Schema.Type<typeof WebSearchProviderSchema>

export function selectWebSearchProvider(sessionID: string, flags = { exa: false, parallel: false }): WebSearchProvider {
  const override = process.env.VIQO_WEBSEARCH_PROVIDER
  if (override === "inferviqo" || override === "exa" || override === "parallel") return override
  if (flags.parallel) return "parallel"
  if (flags.exa) return "exa"
  // Default for Viqo provider (websearch enabled without Exa/Parallel flags): self-hosted gateway.
  return "inferviqo"
}

export function webSearchProviderLabel(provider: unknown) {
  if (provider === "inferviqo") return "Inferviqo Web Search"
  if (provider === "parallel") return "Parallel Web Search"
  if (provider === "exa") return "Exa Web Search"
  return "Web Search"
}

export function webSearchModelName(extra: Tool.Context["extra"]) {
  const model = extra?.model
  if (!model || typeof model !== "object") return undefined
  const api = "api" in model && model.api && typeof model.api === "object" ? model.api : undefined
  const apiID = api && "id" in api && typeof api.id === "string" ? api.id : undefined
  const id = "id" in model && typeof model.id === "string" ? model.id : undefined
  return (apiID ?? id)?.slice(0, 100)
}

export function inferviqoWebSearchUrl(baseUrl = process.env.VIQO_API_BASE_URL) {
  const root = (baseUrl || "https://api.inferviqo.com").trim().replace(/\/+$/, "")
  if (root.endsWith("/v1")) return `${root}/websearch`
  return `${root}/v1/websearch`
}

function parallelAuthHeaders() {
  const headers = { "User-Agent": `viqo/${InstallationVersion}` }
  if (!process.env.PARALLEL_API_KEY) return headers
  return { ...headers, Authorization: `Bearer ${process.env.PARALLEL_API_KEY}` }
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

function formatInferviqoResults(query: string, results: ReadonlyArray<{ title?: string; url?: string; content?: string; engine?: string }>) {
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

function resolveInferviqoApiKey(auth: Auth.Info | undefined) {
  if (process.env.VIQO_API_KEY?.trim()) return process.env.VIQO_API_KEY.trim()
  if (process.env.VIQO_GATEWAY_API_KEY?.trim()) return process.env.VIQO_GATEWAY_API_KEY.trim()
  if (auth?.type === "api") return auth.key
  if (auth?.type === "oauth") return auth.access
  if (auth?.type === "wellknown") return auth.token
  return undefined
}

function callInferviqo(
  http: HttpClient.HttpClient,
  auth: Auth.Interface,
  params: Schema.Schema.Type<typeof Parameters>,
) {
  return Effect.gen(function* () {
    const credential = yield* auth.get("viqo").pipe(Effect.orElseSucceed(() => undefined))
    const apiKey = resolveInferviqoApiKey(credential)
    if (!apiKey) {
      return yield* Effect.fail(
        new Error("Inferviqo websearch requires VIQO_API_KEY or a stored viqo API key (viqo auth)"),
      )
    }

    const request = yield* HttpClientRequest.post(inferviqoWebSearchUrl()).pipe(
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeaders({
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
        "User-Agent": `viqo/${InstallationVersion}`,
      }),
      HttpClientRequest.bodyJson({
        query: params.query,
        numResults: params.numResults || 8,
      }),
    )
    const response = yield* HttpClient.filterStatusOk(http)
      .execute(request)
      .pipe(
        Effect.timeoutOrElse({
          duration: "30 seconds",
          orElse: () => Effect.die(new Error("inferviqo websearch request timed out")),
        }),
      )
    const body = yield* response.json
    const decoded = yield* Schema.decodeUnknownEffect(InferviqoResponse)(body)
    if (decoded.text?.trim()) return decoded.text
    return formatInferviqoResults(params.query, decoded.results ?? [])
  })
}

function callProvider(
  http: HttpClient.HttpClient,
  auth: Auth.Interface,
  provider: WebSearchProvider,
  params: Schema.Schema.Type<typeof Parameters>,
  ctx: Tool.Context,
) {
  if (provider === "inferviqo") {
    return callInferviqo(http, auth, params)
  }

  if (provider === "parallel") {
    return McpWebSearch.call(
      http,
      McpWebSearch.PARALLEL_URL,
      "web_search",
      McpWebSearch.ParallelSearchArgs,
      {
        objective: params.query,
        search_queries: [params.query],
        session_id: ctx.sessionID,
        model_name: webSearchModelName(ctx.extra),
      },
      "25 seconds",
      parallelAuthHeaders(),
    )
  }

  return McpWebSearch.call(
    http,
    McpWebSearch.EXA_URL,
    "web_search_exa",
    McpWebSearch.SearchArgs,
    {
      query: params.query,
      type: params.type || "auto",
      numResults: params.numResults || 8,
      livecrawl: params.livecrawl || "fallback",
      contextMaxCharacters: params.contextMaxCharacters,
    },
    "25 seconds",
  )
}

export const WebSearchTool = Tool.define(
  "websearch",
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const flags = yield* RuntimeFlags.Service
    const auth = yield* Auth.Service

    return {
      get description() {
        return DESCRIPTION.replace("{{year}}", new Date().getFullYear().toString())
      },
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const provider = selectWebSearchProvider(ctx.sessionID, {
            exa: flags.enableExa,
            parallel: flags.enableParallel,
          })
          const title = webSearchProviderLabel(provider)
          yield* ctx.metadata({ title: `${title} "${params.query}"`, metadata: { provider } })

          yield* ctx.ask({
            permission: "websearch",
            patterns: [params.query],
            always: ["*"],
            metadata: {
              query: params.query,
              numResults: params.numResults,
              livecrawl: params.livecrawl,
              type: params.type,
              contextMaxCharacters: params.contextMaxCharacters,
              provider,
            },
          })

          const result = yield* callProvider(http, auth, provider, params, ctx)

          return {
            output: result ?? "No search results found. Please try a different query.",
            title: `${title}: ${params.query}`,
            metadata: { provider },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
