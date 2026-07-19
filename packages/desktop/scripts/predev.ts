import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.VIQO_CHANNEL ?? "dev"}`

await $`cd ../viqo && bun script/build-node.ts`
