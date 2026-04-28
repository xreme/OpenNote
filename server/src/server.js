const app = require("./app");
const { PORT, DB_FILE, PROCESSED_DIR } = require("./config");
const fs = require("fs");
const path = require("path");
const { getVideoStatus, loadDB, saveToDB } = require("./repositories/videoRepository");
const { processVideo, indexVideo } = require("./services/videoService");

// Load database and resume tasks
loadDB();

const videoStatus = getVideoStatus();
Object.keys(videoStatus.videos).forEach((id) => {
  const video = videoStatus.videos[id];
  if (
    video.status === "compressing" ||
    video.status === "transcribing" ||
    video.status === "uploading"
  ) {
    console.log(`[${id}] Resuming interrupted task...`);
    if (video.inputPath && fs.existsSync(video.inputPath)) {
      processVideo(
        id,
        video.inputPath,
        video.outputPath.replace("/processed/", PROCESSED_DIR + "/"),
        video.transcriptPath,
        video.txtPath,
      );
    } else {
      video.status = "error";
      video.error = "Interrupted by restart and input missing";
    }
  } else if (video.status === "completed" && video.folderPath) {
    const embeddingsPath = path.join(video.folderPath, "embeddings.json");
    if (!fs.existsSync(embeddingsPath)) {
      console.log(`[${id}] Missing embeddings, indexing...`);
      indexVideo(id);
    }
  }
});
saveToDB();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
