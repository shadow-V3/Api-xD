import axios from "axios";
import { createApiKeyMiddleware } from "../../middleware/apikey.js";

export default (app) => {
  async function fetchFreeChatGPT(text, user = "user") {
    try {
      const response = await axios.get("https://api.affiliateplus.xyz/api/chatbot", {
        params: {
          message: text,
          botname: "ShadowGPT",
          ownername: "Shadow",
          user: user,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching content from Free ChatGPT:", error.response?.data || error.message);
      throw new Error("Failed to fetch content from Free ChatGPT");
    }
  }

  app.get("/ai/chatgpt", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, user } = req.query;
      if (!text || text.trim() === "") {
        return res.status(400).json({ status: false, error: "Text is required" });
      }

      const data = await fetchFreeChatGPT(text.trim(), user || "user");

      if (!data || !data.message) {
        return res.status(500).json({ status: false, error: "No response from Free ChatGPT" });
      }

      res.status(200).json({
        status: true,
        result: data.message,
        meta: {
          ai: "ChatGPT-Free",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};