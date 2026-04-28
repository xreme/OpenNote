const path = require("path");
const fs = require("fs");

const { UPLOADS_DIR, PROCESSED_DIR } = require("../config");
const { getVideoStatus, saveToDB } = require("../repositories/videoRepository");
const { getCleanName } = require("../utils/fileHelpers");
const { processVideo } = require("../services/videoService");

const uploadVideos = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const files = Array.isArray(req.files.videos)
    ? req.files.videos
    : [req.files.videos];
  const uploadedVideos = [];
  const videoStatus = getVideoStatus();

  for (const file of files) {
    const id = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = file.name;
    const cleanName = getCleanName(fileName);
    const folderName = `${id}-${cleanName}`;
    const videoFolder = path.join(PROCESSED_DIR, folderName);

    if (!fs.existsSync(videoFolder))
      fs.mkdirSync(videoFolder, { recursive: true });

    const inputPath = path.join(UPLOADS_DIR, `${id}-${fileName}`);
    const outputPathFull = path.join(videoFolder, `${id}-${cleanName}.mp4`);
    const transcriptPath = path.join(videoFolder, `${id}-${cleanName}.json`);
    const txtPath = path.join(videoFolder, `${id}-${cleanName}.txt`);

    await file.mv(inputPath);

    const videoInfo = {
      id,
      originalName: fileName,
      status: "uploading",
      progress: 0,
      outputPath: `/processed/${folderName}/${id}-${cleanName}.mp4`,
      txtPath: txtPath,
      transcriptPath: transcriptPath,
      inputPath: inputPath,
      folderPath: videoFolder,
    };

    videoStatus.videos[id] = videoInfo;
    videoStatus.order.unshift(id);
    uploadedVideos.push(videoInfo);
    saveToDB();

    processVideo(id, inputPath, outputPathFull, transcriptPath, txtPath);
  }

  res.json(uploadedVideos);
};

module.exports = { uploadVideos };
