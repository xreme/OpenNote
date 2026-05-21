const express = require("express");
const router = express.Router();
const { listVideos, reorderVideos, renameVideo, deleteVideo, retryVideo } = require("../controllers/videoController");

router.get("/", listVideos);
router.post("/reorder", reorderVideos);
router.post("/:id/retry", retryVideo);
router.patch("/:id", renameVideo);
router.delete("/:id", deleteVideo);

module.exports = router;
