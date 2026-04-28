const { getVideoStatus, saveToDB } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { PROCESSED_DIR } = require("../config");
const path = require("path");
const fs = require("fs");

const listVideos = (req, res) => {
  const videoStatus = getVideoStatus();
  const orderedVideos = videoStatus.order
    .map((id) => videoStatus.videos[id])
    .filter(Boolean);
  res.json(orderedVideos);
};

const reorderVideos = (req, res) => {
  const { order } = req.body;
  const videoStatus = getVideoStatus();
  if (Array.isArray(order)) {
    videoStatus.order = order;
    saveToDB();
    res.json({ success: true });
  } else {
    res.status(400).send("Invalid order format");
  }
};

const renameVideo = (req, res) => {
  const { id } = req.params;
  const { originalName } = req.body;
  const videoStatus = getVideoStatus();
  const video = videoStatus.videos[id];

  if (video) {
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
            const newFilePath = path.join(oldFolderPath, f.new);
            fs.renameSync(oldFilePath, newFilePath);
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
    saveToDB();
    res.json(video);
  } else {
    res.status(404).send("Video not found");
  }
};

const deleteVideo = (req, res) => {
  const { id } = req.params;
  const videoStatus = getVideoStatus();
  const video = videoStatus.videos[id];
  if (video) {
    if (fs.existsSync(video.folderPath)) {
      fs.rmSync(video.folderPath, { recursive: true, force: true });
    }
    delete videoStatus.videos[id];
    videoStatus.order = videoStatus.order.filter((vId) => vId !== id);
    saveToDB();
    res.json({ success: true });
  } else {
    res.status(404).send("Video not found");
  }
};

module.exports = { listVideos, reorderVideos, renameVideo, deleteVideo };
