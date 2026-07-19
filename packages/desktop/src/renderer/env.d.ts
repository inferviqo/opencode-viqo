import type { ElectronAPI } from "../preload/types"

declare global {
  interface Window {
    api: ElectronAPI
    __VIQO__?: {
      deepLinks?: string[]
    }
  }
}
