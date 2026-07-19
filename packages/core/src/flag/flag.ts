import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["VIQO_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["VIQO_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("VIQO_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  VIQO_AUTO_HEAP_SNAPSHOT: truthy("VIQO_AUTO_HEAP_SNAPSHOT"),
  VIQO_GIT_BASH_PATH: process.env["VIQO_GIT_BASH_PATH"],
  VIQO_CONFIG: process.env["VIQO_CONFIG"],
  VIQO_CONFIG_CONTENT: process.env["VIQO_CONFIG_CONTENT"],
  VIQO_DISABLE_AUTOUPDATE: truthy("VIQO_DISABLE_AUTOUPDATE"),
  VIQO_ALWAYS_NOTIFY_UPDATE: truthy("VIQO_ALWAYS_NOTIFY_UPDATE"),
  VIQO_DISABLE_PRUNE: truthy("VIQO_DISABLE_PRUNE"),
  VIQO_DISABLE_TERMINAL_TITLE: truthy("VIQO_DISABLE_TERMINAL_TITLE"),
  VIQO_SHOW_TTFD: truthy("VIQO_SHOW_TTFD"),
  VIQO_DISABLE_AUTOCOMPACT: truthy("VIQO_DISABLE_AUTOCOMPACT"),
  VIQO_DISABLE_MODELS_FETCH: truthy("VIQO_DISABLE_MODELS_FETCH"),
  VIQO_DISABLE_MOUSE: truthy("VIQO_DISABLE_MOUSE"),
  VIQO_FAKE_VCS: process.env["VIQO_FAKE_VCS"],
  VIQO_SERVER_PASSWORD: process.env["VIQO_SERVER_PASSWORD"],
  VIQO_SERVER_USERNAME: process.env["VIQO_SERVER_USERNAME"],
  VIQO_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("VIQO_DISABLE_FFF"),

  // Experimental
  VIQO_EXPERIMENTAL_FILEWATCHER: Config.boolean("VIQO_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  VIQO_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("VIQO_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  VIQO_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("VIQO_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  VIQO_MODELS_URL: process.env["VIQO_MODELS_URL"],
  VIQO_MODELS_PATH: process.env["VIQO_MODELS_PATH"],
  VIQO_DB: process.env["VIQO_DB"],

  VIQO_WORKSPACE_ID: process.env["VIQO_WORKSPACE_ID"],
  VIQO_EXPERIMENTAL_WORKSPACES: enabledByExperimental("VIQO_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get VIQO_DISABLE_PROJECT_CONFIG() {
    return truthy("VIQO_DISABLE_PROJECT_CONFIG")
  },
  get VIQO_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("VIQO_EXPERIMENTAL_REFERENCES")
  },
  get VIQO_TUI_CONFIG() {
    return process.env["VIQO_TUI_CONFIG"]
  },
  get VIQO_CONFIG_DIR() {
    return process.env["VIQO_CONFIG_DIR"]
  },
  get VIQO_PURE() {
    return truthy("VIQO_PURE")
  },
  get VIQO_PERMISSION() {
    return process.env["VIQO_PERMISSION"]
  },
  get VIQO_PLUGIN_META_FILE() {
    return process.env["VIQO_PLUGIN_META_FILE"]
  },
  get VIQO_CLIENT() {
    return process.env["VIQO_CLIENT"] ?? "cli"
  },
}
