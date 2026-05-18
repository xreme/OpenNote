const fs = require("fs");
const { SETTINGS_FILE } = require("../config");
const { chat } = require("../services/chatService");

const chatHandler = async (req, res) => {
  try {
    const { query, collectionId } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });
    if (!collectionId) return res.status(400).json({ error: "collectionId is required" });

    if (!fs.existsSync(SETTINGS_FILE))
      return res.status(400).json({ error: "Settings not configured" });

    const result = await chat(query, collectionId);
    res.json(result);
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { chatHandler };
