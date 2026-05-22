const { getSettings, saveSettings } = require("../services/settingsService");
const { ENCODER_PRESETS } = require("../config");
const { indexAllPending } = require("../services/videoService");

const getSettingsHandler = (req, res) => {
  res.json(getSettings());
};

const saveSettingsHandler = (req, res) => {
  const prev = getSettings();
  saveSettings(req.body);
  if (req.body.apiKey && req.body.apiKey !== prev.apiKey) {
    indexAllPending();
  }
  res.json({ success: true });
};

const getEncoderPresetsHandler = (req, res) => {
  const presets = Object.entries(ENCODER_PRESETS).map(([key, val]) => ({
    key,
    label: val.label,
  }));
  res.json(presets);
};

module.exports = { getSettingsHandler, saveSettingsHandler, getEncoderPresetsHandler };
