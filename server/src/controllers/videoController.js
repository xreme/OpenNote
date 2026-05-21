const {
  getVideoStatus,
  saveCollection,
  findVideoById,
} = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { PROCESSED_DIR } = require("../config");
const { processUrlVideo } = require("../services/videoService");
const path = require("path");
const fs = require("fs");

const listVideos = (req, res) => {
  const { collection } = req.query;
  if (!collection) return res.status(400).json({ error: "collection query param is required" });

  const videoStatus = getVideoStatus(collection);
  const orderedVideos = videoStatus.order.map((id) => videoStatus.videos[id]).filter(Boolean);
  res.json(orderedVideos);
};

const reorderVideos = (req, res) => {
  const { order, collectionId } = req.body;
  if (!collectionId) return res.status(400).json({ error: "collectionId is required" });

  const videoStatus = getVideoStatus(collectionId);
  if (Array.isArray(order)) {
    videoStatus.order = order;
    saveCollection(collectionId);
    res.json({ success: true });
  } else {
    res.status(400).send("Invalid order format");
  }
};

const renameVideo = (req, res) => {
  const { id } = req.params;
  const { originalName } = req.body;

  const found = findVideoById(id);
  if (!found) return res.status(404).send("Video not found");

  const { video, collectionId } = found;
  const videoStatus = getVideoStatus(collectionId);

  const oldCleanName = getCleanName(video.originalName);
  const newCleanName = getCleanName(originalName);
  const oldFolderName = `${id}-${oldCleanName}`;
  const newFolderName = `${id}-${newCleanName}`;

  if (oldCleanName !== newCleanName) {
    const oldFolderPath = path.join(PROCESSED_DIR, oldFolderName);
    const newFolderPath = path.join(PROCESSED_DIR, newFolderName);

    if (fs.existsSync(oldFolderPath)) {
      const files = [
        { old: `${id}-${oldCleanName}.mp4`, new: `${id}-${newCleanName}.mp4` },
        { old: `${id}-${oldCleanName}.json`, new: `${id}-${newCleanName}.json` },
        { old: `${id}-${oldCleanName}.txt`, new: `${id}-${newCleanName}.txt` },
      ];

      files.forEach((f) => {
        const oldFilePath = path.join(oldFolderPath, f.old);
        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, path.join(oldFolderPath, f.new));
        }
      });

      fs.renameSync(oldFolderPath, newFolderPath);

      video.folderPath = newFolderPath;
      video.outputPath = `/processed/${newFolderName}/${id}-${newCleanName}.mp4`;
      video.transcriptPath = path.join(newFolderPath, `${id}-${newCleanName}.json`);
      video.txtPath = path.join(newFolderPath, `${id}-${newCleanName}.txt`);
    }
  }

  video.originalName = originalName;
  saveCollection(collectionId);
  res.json(videoStatus.videos[id]);
};

const deleteVideo = (req, res) => {
  const { id } = req.params;

  const found = findVideoById(id);
  if (!found) return res.status(404).send("Video not found");

  const { video, collectionId } = found;
  const videoStatus = getVideoStatus(collectionId);

  if (fs.existsSync(video.folderPath)) {
    fs.rmSync(video.folderPath, { recursive: true, force: true });
  }

  delete videoStatus.videos[id];
  videoStatus.order = videoStatus.order.filter((vId) => vId !== id);
  saveCollection(collectionId);
  res.json({ success: true });
};

const retryVideo = (req, res) => {
  const { id } = req.params;

  const found = findVideoById(id);
  if (!found) return res.status(404).send("Video not found");

  const { video } = found;
  if (!video.sourceUrl) return res.status(400).json({ error: "Only URL-sourced videos can be retried" });
  if (!["error"].includes(video.status)) return res.status(400).json({ error: "Video is not in a failed state" });

  const outputPathFull = path.join(video.folderPath, path.basename(video.transcriptPath).replace(/\.json$/, ".mp4"));
  const relativeOutputPath = video.outputPath || `/processed/${path.relative(PROCESSED_DIR, outputPathFull)}`;

  res.json({ success: true });
  processUrlVideo(id, video.sourceUrl, video.transcriptPath, video.txtPath, outputPathFull, relativeOutputPath);
};

module.exports = { listVideos, reorderVideos, renameVideo, deleteVideo, retryVideo };
