const express = require("express");
const router = express.Router();
const { openFolderHandler } = require("../controllers/systemController");
const { getEncoderPresetsHandler } = require("../controllers/settingsController");
const { generateNotesHandler } = require("../controllers/notesController");

router.get("/ping", (req, res) => res.json({ ok: true }));
router.post("/open-folder", openFolderHandler);
router.get("/encoder-presets", getEncoderPresetsHandler);
router.post("/generate-notes", generateNotesHandler);

module.exports = router;
