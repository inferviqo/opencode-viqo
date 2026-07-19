const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://inferviqo.com" : `https://${stage}.viqo.ai`,
  console: stage === "production" ? "https://inferviqo.com/auth" : `https://${stage}.viqo.ai/auth`,
  email: "help@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/Inferviqo/viqo",
  discord: "https://inferviqo.com/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}
