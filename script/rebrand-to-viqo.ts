#!/usr/bin/env bun

import fs from "fs"
import path from "path"

const root = path.resolve(import.meta.dirname, "..")
const SELF = path.join(root, "script/rebrand-to-viqo.ts")

const SKIP_DIRS = new Set([".git", "node_modules", "dist", ".turbo"])
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
  ".toml",
  ".nix",
  ".sh",
  ".astro",
  ".html",
  ".css",
  ".svg",
  ".txt",
  ".patch",
  ".lock",
  ".tsv",
  ".env",
  ".example",
  ".desktop",
  ".plist",
  ".xml",
  ".sql",
  ".proto",
  ".gitignore",
  ".dockerignore",
  ".editorconfig",
  ".prettierrc",
  "",
])

const PROTECTED = [
  ["@opentui/", "__PROTECTED_OPENTUI__"],
  ["@openauthjs/", "__PROTECTED_OPENAUTH__"],
  ["@gitlab/opencode-gitlab-auth", "__PROTECTED_GITLAB_AUTH__"],
  ["opencode-gitlab-auth", "__PROTECTED_GITLAB_AUTH_PKG__"],
  ["opencode-poe-auth", "__PROTECTED_POE_AUTH__"],
] as const

const REPLACEMENTS = [
  ["@opencode-ai", "@viqo-ai"],
  ["@opencode/", "@viqo/"],
  ["OPENCODE_", "VIQO_"],
  ["packages/opencode", "packages/viqo"],
  [".opencode", ".viqo"],
  ["opencode-ai", "viqo-ai"],
  ["opencode-desktop", "viqo-desktop"],
  ["opencode-go", "viqo-go"],
  ["opencode-local", "viqo-local"],
  ["opencode-cli", "viqo-cli"],
  ["opencode-v2", "viqo-v2"],
  ["OpencodeClientConfig", "ViqoClientConfig"],
  ["createOpencodeServer", "createViqoServer"],
  ["createOpencodeClient", "createViqoClient"],
  ["OpencodeClient", "ViqoClient"],
  ["OpencodeKeymapProvider", "ViqoKeymapProvider"],
  ["useOpencodeKeymap", "useViqoKeymap"],
  ["useOpencodeModeStack", "useViqoModeStack"],
  ["getOpencodeModeStack", "getViqoModeStack"],
  ["createOpencodeModeStack", "createViqoModeStack"],
  ["registerOpencodeKeymap", "registerViqoKeymap"],
  ["OpencodeModeStack", "ViqoModeStack"],
  ["OpencodePlugin", "ViqoPlugin"],
  ["resolveWslOpencode", "resolveWslViqo"],
  ["expectOpencodeVersion", "expectViqoVersion"],
  ["customize-opencode", "customize-viqo"],
  ["remove-opencode-db", "remove-viqo-db"],
  ["raw.githubusercontent.com/anomalyco", "raw.githubusercontent.com/Inferviqo"],
  ["ghcr.io/anomalyco", "ghcr.io/Inferviqo"],
  ["github.com/anomalyco", "github.com/Inferviqo"],
  ["anomalyco/tap", "Inferviqo/tap"],
  ["anomalyco/opencode", "Inferviqo/viqo"],
  ["owner: \"anomalyco\"", "owner: \"Inferviqo\""],
  ["opencode-beta", "viqo-beta"],
  ["sst-dev.opencode", "inferviqo.viqo"],
  ["\"publisher\": \"sst-dev\"", "\"publisher\": \"inferviqo\""],
  ["\"name\": \"OpenCode\"", "\"name\": \"Inferviqo\""],
  ["hello@opencode.ai", "hello@inferviqo.com"],
  ["--sso-session=opencode", "--sso-session=viqo"],
  ["opencode.ai", "inferviqo.com"],
  ["OpenCode", "Viqo"],
  ["OPENCODE", "VIQO"],
  ["opencode", "viqo"],
] as const

const FILE_RENAMES = [
  [".opencode", ".viqo"],
  ["packages/opencode", "packages/viqo"],
  ["packages/viqo/bin/opencode", "packages/viqo/bin/viqo"],
  ["packages/core/bin/opencode", "packages/core/bin/viqo"],
  [".viqo/opencode.jsonc", ".viqo/viqo.jsonc"],
  ["packages/core/src/plugin/provider/opencode.ts", "packages/core/src/plugin/provider/viqo.ts"],
  ["packages/core/test/plugin/provider-opencode.test.ts", "packages/core/test/plugin/provider-viqo.test.ts"],
  ["packages/core/src/plugin/skill/customize-opencode.md", "packages/core/src/plugin/skill/customize-viqo.md"],
  ["packages/sdk-next/src/opencode.ts", "packages/sdk-next/src/viqo.ts"],
  ["packages/ui/src/theme/themes/opencode.json", "packages/ui/src/theme/themes/viqo.json"],
  ["packages/ui/src/assets/icons/provider/opencode.svg", "packages/ui/src/assets/icons/provider/viqo.svg"],
  ["packages/ui/src/assets/icons/provider/opencode-go.svg", "packages/ui/src/assets/icons/provider/viqo-go.svg"],
  ["packages/tui/src/theme/assets/opencode.json", "packages/tui/src/theme/assets/viqo.json"],
  ["packages/desktop/resources/linux/opencode-desktop.desktop", "packages/desktop/resources/linux/viqo-desktop.desktop"],
  ["packages/codemode/test/fixtures/opencode-v2-openapi.json", "packages/codemode/test/fixtures/viqo-v2-openapi.json"],
  ["nix/opencode.nix", "nix/viqo.nix"],
  [".github/workflows/opencode.yml", ".github/workflows/viqo.yml"],
  ["specs/storage/remove-opencode-db.md", "specs/storage/remove-viqo-db.md"],
  ["packages/console/app/src/asset/lander/opencode-wordmark-light.svg", "packages/console/app/src/asset/lander/viqo-wordmark-light.svg"],
  ["packages/console/app/src/asset/lander/opencode-wordmark-dark.svg", "packages/console/app/src/asset/lander/viqo-wordmark-dark.svg"],
  ["packages/console/app/src/asset/lander/opencode-logo-light.svg", "packages/console/app/src/asset/lander/viqo-logo-light.svg"],
  ["packages/console/app/src/asset/lander/opencode-logo-dark.svg", "packages/console/app/src/asset/lander/viqo-logo-dark.svg"],
  ["packages/console/app/src/asset/brand/opencode-wordmark-simple-light.svg", "packages/console/app/src/asset/brand/viqo-wordmark-simple-light.svg"],
  ["packages/console/app/src/asset/brand/opencode-wordmark-simple-dark.svg", "packages/console/app/src/asset/brand/viqo-wordmark-simple-dark.svg"],
  ["packages/console/app/src/asset/brand/opencode-wordmark-light.svg", "packages/console/app/src/asset/brand/viqo-wordmark-light.svg"],
  ["packages/console/app/src/asset/brand/opencode-wordmark-dark.svg", "packages/console/app/src/asset/brand/viqo-wordmark-dark.svg"],
  ["packages/console/app/src/asset/brand/opencode-logo-light.svg", "packages/console/app/src/asset/brand/viqo-logo-light.svg"],
  ["packages/console/app/src/asset/brand/opencode-logo-light-square.svg", "packages/console/app/src/asset/brand/viqo-logo-light-square.svg"],
  ["packages/console/app/src/asset/brand/opencode-logo-dark.svg", "packages/console/app/src/asset/brand/viqo-logo-dark.svg"],
  ["packages/console/app/src/asset/brand/opencode-logo-dark-square.svg", "packages/console/app/src/asset/brand/viqo-logo-dark-square.svg"],
] as const

function isTextFile(file: string) {
  const ext = path.extname(file)
  const base = path.basename(file)
  if (TEXT_EXTENSIONS.has(ext)) return true
  if (base === "AGENTS.md" || base === "CONTRIBUTING.md" || base === "LICENSE" || base === "Dockerfile") return true
  return false
}

function walk(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

function transform(content: string) {
  let next = content
  for (const [from, to] of PROTECTED) next = next.replaceAll(from, to)
  for (const [from, to] of REPLACEMENTS) next = next.replaceAll(from, to)
  for (const [from, to] of [...PROTECTED].reverse()) next = next.replaceAll(to, from)
  return next
}

function renamePath(fromRel: string, toRel: string) {
  const from = path.join(root, fromRel)
  const to = path.join(root, toRel)
  if (!fs.existsSync(from)) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.renameSync(from, to)
  console.log(`renamed ${fromRel} -> ${toRel}`)
}

console.log("Rebranding opencode -> viqo for Inferviqo...")

for (const file of walk(root)) {
  if (file === SELF) continue
  if (!fs.statSync(file).isFile()) continue
  if (!isTextFile(file)) continue
  const original = fs.readFileSync(file, "utf8")
  const updated = transform(original)
  if (updated !== original) {
    fs.writeFileSync(file, updated)
    console.log(`updated ${path.relative(root, file)}`)
  }
}

for (const [from, to] of FILE_RENAMES) renamePath(from, to)

console.log("Done.")
