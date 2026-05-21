const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const { YTDLP_BIN, PROCESSED_DIR } = require("../config");
const { addVideoToCollection, getUniqueVideoName } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { processUrlVideo } = require("../services/videoService");

const uploadFromUrl = async (req, res) => {
  const { url, collectionId } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  if (!collectionId) return res.status(400).json({ error: "collectionId is required" });

  const id = Date.now() + "-" + Math.round(Math.random() * 1e9);

  exec(
    `"${YTDLP_BIN}" --print "%(title)s" --no-playlist "${url}"`,
    async (err, titleStdout) => {
      const rawTitle = (titleStdout || "").trim() || "video";
      const safeTitle = rawTitle.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "video";
      const originalName = getUniqueVideoName(collectionId, `${safeTitle}.mp4`);
      const cleanName = getCleanName(originalName);
      const folderName = `${id}-${cleanName}`;
      const videoFolder = path.join(PROCESSED_DIR, folderName);

      if (!fs.existsSync(videoFolder)) fs.mkdirSync(videoFolder, { recursive: true });

      const transcriptPath = path.join(videoFolder, `${id}-${cleanName}.json`);
      const txtPath = path.join(videoFolder, `${id}-${cleanName}.txt`);

      const outputPathFull = path.join(videoFolder, `${id}-${cleanName}.mp4`);
      const relativeOutputPath = `/processed/${folderName}/${id}-${cleanName}.mp4`;

      const videoInfo = {
        id,
        originalName,
        status: "processing",
        progress: 0,
        outputPath: null,
        txtPath,
        transcriptPath,
        folderPath: videoFolder,
        sourceUrl: url,
      };

      addVideoToCollection(collectionId, videoInfo);
      res.json(videoInfo);

      processUrlVideo(id, url, transcriptPath, txtPath, outputPathFull, relativeOutputPath);
    },
  );
};

module.exports = { uploadFromUrl };
