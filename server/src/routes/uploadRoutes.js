const express = require("express");
const router = express.Router();
const { uploadVideos } = require("../controllers/uploadController");
const { uploadFromUrl } = require("../controllers/urlUploadController");

router.post("/", uploadVideos);
router.post("/url", uploadFromUrl);

module.exports = router;
