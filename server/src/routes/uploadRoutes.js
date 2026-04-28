const express = require("express");
const router = express.Router();
const { uploadVideos } = require("../controllers/uploadController");

router.post("/", uploadVideos);

module.exports = router;
