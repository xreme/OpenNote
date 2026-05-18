const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const { UPLOADS_DIR, PROCESSED_DIR } = require("../config");
const { addVideoToCollection, getUniqueVideoName } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { processVideo } = require("../services/videoService");

const YTDLP_BIN = "/Library/Frameworks/Python.framework/Versions/3.13/bin/yt-dlp";

const uploadFromUrl = async (req, res) => {
  const { url, collectionId } = req.body;

  if (!url) return res.status(400).json({ error: "url is required" });
  if (!collectionId) return res.status(400).json({ error: "collectionId is required" });

  const id = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const tmpTemplate = path.join(UPLOADS_DIR, `${id}-%(title)s.%(ext)s`);

  // Fetch the video title first so we can name things properly
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

      const inputPath = path.join(UPLOADS_DIR, `${id}-${safeTitle}.mp4`);
      const outputPathFull = path.join(videoFolder, `${id}-${cleanName}.mp4`);
      const transcriptPath = path.join(videoFolder, `${id}-${cleanName}.json`);
      const txtPath = path.join(videoFolder, `${id}-${cleanName}.txt`);

      const videoInfo = {
        id,
        originalName,
        status: "uploading",
        progress: 0,
        outputPath: `/processed/${folderName}/${id}-${cleanName}.mp4`,
        txtPath,
        transcriptPath,
        inputPath,
        folderPath: videoFolder,
        sourceUrl: url,
      };

      addVideoToCollection(collectionId, videoInfo);
      res.json(videoInfo);

      // Download in background — cap at 1080p H.264 so the source mp4 is universally openable
      exec(
        `"${YTDLP_BIN}" --no-playlist -f "bestvideo[height<=1080][ext=mp4][vcodec^=avc]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --merge-output-format mp4 -o "${inputPath}" "${url}"`,
        (dlErr, _stdout, dlStderr) => {
          if (dlErr) {
            console.error(`[${id}] yt-dlp failed:`, dlStderr);
            const { updateStatus } = require("../repositories/videoRepository");
            updateStatus(id, "error", { error: "Download failed: " + dlStderr });
            return;
          }
          processVideo(id, inputPath, outputPathFull, transcriptPath, txtPath);
        }
      );
    }
  );
};

module.exports = { uploadFromUrl };
