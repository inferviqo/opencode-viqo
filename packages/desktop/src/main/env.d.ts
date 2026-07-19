interface ImportMetaEnv {
  readonly VIQO_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:viqo-server" {
  export namespace Server {
    export const listen: typeof import("../../../viqo/dist/types/src/node").Server.listen
    export type Listener = import("../../../viqo/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../viqo/dist/types/src/node").Config.get
    export type Info = import("../../../viqo/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../viqo/dist/types/src/node").bootstrap
}
