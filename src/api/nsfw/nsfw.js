import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function getWaifuNSFW() {
    try {
      // 1. Obtener URL de la imagen desde la API
      const { data } = await axios.get(`https://api.waifu.pics/nsfw/waifu`)

      // 2. Descargar imagen como buffer
      const response = await axios.get(data.url, { responseType: "arraybuffer" })
      return Buffer.from(response.data)
    } catch (error) {
      throw error
    }
  }

  app.get("/random/nsfw/waifu", createApiKeyMiddleware(), async (req, res) => {
    try {
      const imageBuffer = await getWaifuNSFW()

      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": imageBuffer.length
      })
      res.end(imageBuffer)

      console.log("🙂 Sent NSFW waifu image")

    } catch (error) {
      res.status(500).json({
        status: false,
        message: "❌ No se pudo obtener la imagen NSFW",
        error: error.message
      })
    }
  })
}