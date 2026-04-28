const express = require("express");
const router = express.Router();
const { getSettingsHandler, saveSettingsHandler, getEncoderPresetsHandler } = require("../controllers/settingsController");

router.get("/", getSettingsHandler);
router.post("/", saveSettingsHandler);

module.exports = router;
