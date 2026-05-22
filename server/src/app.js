const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");

const { PROCESSED_DIR, CLIENT_DIST, UPLOADS_DIR, NOTES_DIR, COLLECTIONS_DIR, PREVIEW_MODE } = require("./config");
const requirePassword = require("./middleware/auth");
const readOnly = require("./middleware/readOnly");
const { uploadLimiter, aiLimiter } = require("./middleware/rateLimiter");
const videoRoutes = require("./routes/videoRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notesRoutes = require("./routes/notesRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const systemRoutes = require("./routes/systemRoutes");
const collectionsRoutes = require("./routes/collectionsRoutes");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
if (!fs.existsSync(COLLECTIONS_DIR)) fs.mkdirSync(COLLECTIONS_DIR, { recursive: true });

const app = express();

app.set("trust proxy", 1);

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

// Preview status endpoint — no auth required
app.get("/api/preview-status", (req, res) => {
  res.json({ previewMode: PREVIEW_MODE });
});

// API routes — all require password when SITE_PASSWORD env var is set
// readOnly(msg) blocks non-GET methods when PREVIEW_MODE is enabled
app.use("/videos", requirePassword, readOnly("Editing videos is not available in preview mode"), videoRoutes);
app.use("/upload", requirePassword, readOnly("Uploading content is not available in preview mode"), uploadLimiter, uploadRoutes);
app.use("/notes", requirePassword, readOnly("Editing notes is not available in preview mode"), notesRoutes);
app.use("/settings", requirePassword, readOnly("Changing settings is not available in preview mode"), settingsRoutes);
app.use("/chat", requirePassword, aiLimiter, chatRoutes);
app.use("/collections", requirePassword, readOnly("Managing collections is not available in preview mode"), collectionsRoutes);
app.use("/", requirePassword, readOnly("This action is not available in preview mode"), systemRoutes); // includes /ping and /generate-notes

// Catch-all route to serve index.html for SPA
app.get("/*path", (req, res) => {
  const path = require("path");
  res.sendFile(path.join(CLIENT_DIST, "index.html"));
});

module.exports = app;
