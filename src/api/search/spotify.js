import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/search/spotify", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Falta el parámetro ?query=" });

    const url = `https://spclient.wg.spotify.com/searchview/v1/suggest?query=${encodeURIComponent(query)}&limit=12`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "App-platform": "WebPlayer",
        "X-Client-Id": "d8a5ed958d274c2e8ee717e6a4b0971d"
      }
    });

    const data = await response.json();

    const results = data?.tracks?.items?.map(t => ({
      id: t.data.id,
      title: t.data.name,
      artists: t.data.artists.items.map(a => a.profile.name).join(", "),
      album: t.data.albumOfTrack?.name,
      cover: t.data.albumOfTrack?.coverArt?.sources?.[0]?.url,
      preview_url: t.data.preview?.url || null,
      external_url: "https://open.spotify.com/track/" + t.data.id
    })) || [];

    res.json({
      status: true,
      creator: "Shadow.xyz",
      query,
      total_results: results.length,
      results
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;