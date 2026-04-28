const fs = require("fs");
const { DB_FILE } = require("../config");

let videoStatus = { videos: {}, order: [] };

const saveToDB = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(videoStatus, null, 2));
};

const migrateDB = (data) => {
  if (data && !data.videos && !data.order) {
    const videos = data;
    const order = Object.keys(videos).sort((a, b) => b - a);
    return { videos, order };
  }
  return data || { videos: {}, order: [] };
};

const updateStatus = (id, status, details = {}) => {
  if (videoStatus.videos[id]) {
    videoStatus.videos[id] = { ...videoStatus.videos[id], status, ...details };
    saveToDB();
  }
  console.log(
    `[${id}] Status: ${status} ${details.progress ? `(${details.progress}%)` : ""}`,
  );
};

const loadDB = () => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const rawData = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      videoStatus = migrateDB(rawData);
    } catch (e) {
      console.error("Failed to load DB", e);
    }
  }
};

const getVideoStatus = () => videoStatus;

module.exports = { getVideoStatus, saveToDB, migrateDB, updateStatus, loadDB };
