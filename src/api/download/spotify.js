import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function scrapeSpotify(url) {
    try {
      const initialResponse = await axios.get(
        `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(url)}`,
        {
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"24\", \"Chromium\";v=\"116\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            Referer: "https://spotifydownload.org/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        }
      )

      const { result } = initialResponse.data
      const trackId = result.type === "album" ? result.tracks[0].id : result.id

      const convertResponse = await axios.get(
        `https://api.fabdl.com/spotify/mp3-convert-task/${result.gid}/${trackId}`,
        {
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"24\", \"Chromium\";v=\"116\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            Referer: "https://spotifydownload.org/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        }
      )

      const tid = convertResponse.data.result.tid

      let downloadUrl = null
      for (let i = 0; i < 15; i++) {
        await new Promise(res => setTimeout(res, 1500))

        const progress = await axios.get(
          `https://api.fabdl.com/spotify/mp3-convert-progress/${tid}`,
          {
            headers: {
              accept: "application/json, text/plain, */*",
              "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
              "sec-ch-ua": "\"Not)A;Brand\";v=\"24\", \"Chromium\";v=\"116\"",
              "sec-ch-ua-mobile": "?1",
              "sec-ch-ua-platform": "\"Android\"",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "cross-site",
              Referer: "https://spotifydownload.org/",
              "Referrer-Policy": "strict-origin-when-cross-origin",
            },
          }
        )

        if (progress.data.result.status === "finished") {
          downloadUrl = `https://api.fabdl.com${progress.data.result.download_url}`
          break
        }
      }

      if (!downloadUrl) throw new Error("No se pudo generar el audio, intenta de nuevo")

      return {
        title: result.name,
        type: result.type,
        artis: result.artists,
        durasi: result.type === "album" ? result.tracks[0].duration_ms : result.duration_ms,
        image: result.image,
        download: downloadUrl,
        status: "finished",
      }

    } catch (error) {
      console.error("Spotify download error:", error)
      throw new Error("Failed to download from Spotify")
    }
  }

  app.get("/download/spotify", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query
      if (!url) return res.status(400).json({ status: false, error: "Parameter URL is required" })
      const result = await scrapeSpotify(url.trim())
      res.status(200).json({ status: true, data: result, timestamp: new Date().toISOString() })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message })
    }
  })

  app.post("/download/spotify", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body
      if (!url) return res.status(400).json({ status: false, error: "Parameter URL is required" })
      const result = await scrapeSpotify(url.trim())
      res.status(200).json({ status: true, data: result, timestamp: new Date().toISOString() })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message })
    }
  })
}