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

      // TikTok's HEVC 1080p streams lack audio despite metadata claiming otherwise.
      // H.264 muxed formats (reported as "h264" on TikTok, "avc1" on YouTube) reliably
      // include audio. Prefer those, then fall back to separate streams, then best muxed.
      const fmt = [
        "bestvideo[height<=1080][ext=mp4][vcodec^=avc]+bestaudio[ext=m4a]",
        "bestvideo[height<=1080][ext=mp4]+bestaudio",
        "best[vcodec^=h264][ext=mp4]",
        "best[vcodec^=avc][ext=mp4]",
        "best[ext=mp4]",
        "best",
      ].join("/");

      const h264OnlyFmt = "best[vcodec^=h264][ext=mp4]/best[vcodec^=avc][ext=mp4]/best";

      const downloadAndVerify = (formatStr, attempt) => {
        exec(
          `"${YTDLP_BIN}" --no-playlist -f "${formatStr}" --merge-output-format mp4 -o "${inputPath}" "${url}"`,
          (dlErr, _stdout, dlStderr) => {
            if (dlErr) {
              console.error(`[${id}] yt-dlp failed:`, dlStderr);
              const { updateStatus } = require("../repositories/videoRepository");
              updateStatus(id, "error", { error: "Download failed: " + dlStderr });
              return;
            }

            exec(
              `ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${inputPath}"`,
              (probeErr, probeOut) => {
                if (!probeErr && probeOut.trim()) {
                  processVideo(id, inputPath, outputPathFull, transcriptPath, txtPath);
                  return;
                }

                if (attempt < 1) {
                  console.warn(`[${id}] Downloaded file has no audio, retrying with H.264-only`);
                  if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                  downloadAndVerify(h264OnlyFmt, attempt + 1);
                  return;
                }

                console.warn(`[${id}] No audio after retry, processing anyway`);
                processVideo(id, inputPath, outputPathFull, transcriptPath, txtPath);
              },
            );
          },
        );
      };

      downloadAndVerify(fmt, 0);
    }
  );
};

module.exports = { uploadFromUrl };
