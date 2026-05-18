const app = require("./app");
const { PORT, PROCESSED_DIR } = require("./config");
const fs = require("fs");
const path = require("path");
const {
  loadAllCollections,
  getAllVideosAcrossCollections,
  saveCollection,
  findVideoById,
} = require("./repositories/videoRepository");
const { processVideo, indexVideo } = require("./services/videoService");

loadAllCollections();

const allVideos = getAllVideosAcrossCollections();
Object.entries(allVideos).forEach(([id, video]) => {
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
      const found = findVideoById(id);
      if (found) {
        const { video: v, collectionId } = found;
        v.status = "error";
        v.error = "Interrupted by restart and input missing";
        saveCollection(collectionId);
      }
    }
  } else if (video.status === "completed" && video.folderPath) {
    const embeddingsPath = path.join(video.folderPath, "embeddings.json");
    if (!fs.existsSync(embeddingsPath)) {
      console.log(`[${id}] Missing embeddings, indexing...`);
      indexVideo(id);
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
