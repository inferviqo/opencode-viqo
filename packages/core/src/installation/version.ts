declare global {
  const VIQO_VERSION: string
  const VIQO_CHANNEL: string
}

export const InstallationVersion = typeof VIQO_VERSION === "string" ? VIQO_VERSION : "local"
export const InstallationChannel = typeof VIQO_CHANNEL === "string" ? VIQO_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
