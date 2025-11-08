import express from "express";
import fetch from "node-fetch";

const router = express.Router();

let spotifyToken = null;
let tokenExpiration = 0;

// 🔥 Función para obtener o reutilizar el token de Spotify
async function getSpotifyToken() {
  const now = Date.now();

  // Si el token aún es válido, lo reutilizamos
  if (spotifyToken && now < tokenExpiration) return spotifyToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Error al obtener token");

  // Guardamos token y tiempo de expiración
  spotifyToken = data.access_token;
  tokenExpiration = now + data.expires_in * 1000 - 60 * 1000; // resta 1 min por seguridad
  return spotifyToken;
}

// 🎧 Endpoint principal
router.get("/search/spotify", async (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro 'q' (búsqueda)" });

  const maxResults = limit ? parseInt(limit) : 15;

  try {
    const token = await getSpotifyToken();

    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      q
    )}&type=track&limit=${maxResults}`;

    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    const tracks = data.tracks.items.map((track) => ({
      id: track.id,
      title: track.name,
      artists: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      album_release_date: track.album.release_date,
      duration_min: (track.duration_ms / 60000).toFixed(2),
      explicit: track.explicit,
      popularity: track.popularity,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      cover: track.album.images?.[0]?.url,
    }));

    res.json({
      status: true,
      creator: "Shadow.xyz",
      query: q,
      total_results: tracks.length,
      results: tracks,
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;