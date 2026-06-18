const express = require("express");
const router = express.Router();
const { listVideos, reorderVideos, renameVideo, deleteVideo, retryVideo, downloadVideo } = require("../controllers/videoController");

router.get("/", listVideos);
router.post("/reorder", reorderVideos);
router.post("/:id/retry", retryVideo);
router.post("/:id/download", downloadVideo);
router.patch("/:id", renameVideo);
router.delete("/:id", deleteVideo);

module.exports = router;
