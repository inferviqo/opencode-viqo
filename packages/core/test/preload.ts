import path from "path"

process.env.VIQO_DB = ":memory:"
process.env.VIQO_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.VIQO_DISABLE_MODELS_FETCH = "true"
