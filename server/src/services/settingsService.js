const fs = require("fs");
const { SETTINGS_FILE } = require("../config");

const getSettings = () => {
  if (fs.existsSync(SETTINGS_FILE)) {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  }
  return {};
};

const saveSettings = (settings) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

module.exports = { getSettings, saveSettings };
