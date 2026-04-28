const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");

const { PROCESSED_DIR, CLIENT_DIST, UPLOADS_DIR, NOTES_DIR } = require("./config");
const videoRoutes = require("./routes/videoRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notesRoutes = require("./routes/notesRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const systemRoutes = require("./routes/systemRoutes");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Static files for serving processed videos with iOS-compatible settings
app.use(
  "/processed",
  express.static(PROCESSED_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
      }
    },
  }),
);

// Serve React static files
app.use(express.static(CLIENT_DIST));

// Routes
app.use("/videos", videoRoutes);
app.use("/upload", uploadRoutes);
app.use("/notes", notesRoutes);
app.use("/settings", settingsRoutes);
app.use("/chat", chatRoutes);
app.use("/", systemRoutes);

// Catch-all route to serve index.html for SPA
app.get("/*path", (req, res) => {
  const path = require("path");
  res.sendFile(path.join(CLIENT_DIST, "index.html"));
});

module.exports = app;
