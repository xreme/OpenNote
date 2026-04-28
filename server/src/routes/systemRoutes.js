const express = require("express");
const router = express.Router();
const { openFolderHandler } = require("../controllers/systemController");
const { getEncoderPresetsHandler } = require("../controllers/settingsController");
const { generateNotesHandler } = require("../controllers/notesController");

router.post("/open-folder", openFolderHandler);
router.get("/encoder-presets", getEncoderPresetsHandler);
router.post("/generate-notes", generateNotesHandler);

module.exports = router;
