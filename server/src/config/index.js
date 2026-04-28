const path = require("path");

const SERVER_DIR = path.join(__dirname, "..", "..");  // server/
const PROJECT_DIR = path.join(SERVER_DIR, "..");       // project root
const DATA_DIR = path.join(PROJECT_DIR, "data");       // data/

const PORT = 5001;

const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const PROCESSED_DIR = path.join(DATA_DIR, "processed");
const DB_FILE = path.join(SERVER_DIR, "db.json");
const SETTINGS_FILE = path.join(SERVER_DIR, "settings.json");
const NOTES_DIR = path.join(DATA_DIR, "notes");
const CLIENT_DIST = path.join(PROJECT_DIR, "client", "dist");
const TRANSCRIBE_SCRIPT = path.join(SERVER_DIR, "transcribe.py");

const ENCODER_PRESETS = {
  videotoolbox: {
    label: "Apple VideoToolbox (macOS)",
    options: ["-vcodec hevc_videotoolbox", "-q:v 65"],
  },
  qsv: {
    label: "Intel Quick Sync (QSV)",
    options: ["-vcodec hevc_qsv", "-preset fast", "-look_ahead 1"],
  },
  nvenc: {
    label: "NVIDIA NVENC",
    options: ["-vcodec hevc_nvenc", "-preset fast", "-rc vbr", "-cq 28"],
  },
  software: {
    label: "Software (libx265)",
    options: ["-vcodec libx265", "-preset fast", "-crf 28"],
  },
};

module.exports = {
  PORT,
  UPLOADS_DIR,
  PROCESSED_DIR,
  DB_FILE,
  SETTINGS_FILE,
  NOTES_DIR,
  CLIENT_DIST,
  TRANSCRIBE_SCRIPT,
  ENCODER_PRESETS,
};
