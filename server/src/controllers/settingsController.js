const { getSettings, saveSettings } = require("../services/settingsService");
const { ENCODER_PRESETS } = require("../config");

const getSettingsHandler = (req, res) => {
  res.json(getSettings());
};

const saveSettingsHandler = (req, res) => {
  saveSettings(req.body);
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
