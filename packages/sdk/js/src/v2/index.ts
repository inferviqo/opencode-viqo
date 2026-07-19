export * from "./client.js"
export * from "./server.js"

import { createViqoClient } from "./client.js"
import { createViqoServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createOpencode(options?: ServerOptions) {
  const server = await createViqoServer({
    ...options,
  })

  const client = createViqoClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
