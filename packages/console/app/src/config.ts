/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://inferviqo.com",

  // GitHub
  github: {
    repoUrl: "https://github.com/Inferviqo/viqo",
    starsFormatted: {
      compact: "160K",
      full: "160,000",
    },
  },

  // Social links
  social: {
    twitter: "https://x.com/viqo",
    discord: "https://discord.gg/viqo",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "900",
    commits: "13,000",
    monthlyUsers: "7.5M",
  },
} as const
