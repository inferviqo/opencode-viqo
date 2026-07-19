// @ts-nocheck

import { Viqo } from "@viqo-ai/core"
import { ReadTool } from "@viqo-ai/core/tools"

const viqo = Viqo.make({})

viqo.tool.add(ReadTool)

viqo.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

viqo.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

viqo.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await viqo.session.create({
  agent: "build",
})

viqo.subscribe((event) => {
  console.log(event)
})

await viqo.session.prompt({
  sessionID,
  text: "hey what is up",
})

await viqo.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await viqo.session.wait()

console.log(await viqo.session.messages(sessionID))
