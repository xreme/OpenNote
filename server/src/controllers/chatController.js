const fs = require("fs");
const { SETTINGS_FILE } = require("../config");
const { chat } = require("../services/chatService");

const chatHandler = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    if (!fs.existsSync(SETTINGS_FILE))
      return res.status(400).json({ error: "Settings not configured" });

    const result = await chat(query);
    res.json(result);
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { chatHandler };
