const fs = require("fs");
const { listNotes, renameNote, deleteNote, getNoteFilePath, generateNotes } = require("../services/notesService");
const { SETTINGS_FILE } = require("../config");

const requireCollection = (req, res) => {
  const collectionId = req.query.collection || req.body.collectionId;
  if (!collectionId) {
    res.status(400).json({ error: "collectionId is required" });
    return null;
  }
  return collectionId;
};

const getNotesHandler = (req, res) => {
  const collectionId = requireCollection(req, res);
  if (!collectionId) return;
  res.json(listNotes(collectionId));
};

const renameNoteHandler = (req, res) => {
  const collectionId = requireCollection(req, res);
  if (!collectionId) return;
  const { filename } = req.params;
  const { newFilename } = req.body;

  if (!newFilename) return res.status(400).json({ error: "New filename required" });

  try {
    const newName = renameNote(collectionId, filename, newFilename);
    res.json({ success: true, newFilename: newName });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

const downloadNoteHandler = (req, res) => {
  const collectionId = requireCollection(req, res);
  if (!collectionId) return;
  const { filename } = req.params;
  const filePath = getNoteFilePath(collectionId, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "text/markdown");
    res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) res.status(500).send("Could not download file");
    });
  } else {
    res.status(404).send("File not found");
  }
};

const deleteNoteHandler = (req, res) => {
  const collectionId = requireCollection(req, res);
  if (!collectionId) return;
  const { filename } = req.params;

  try {
    deleteNote(collectionId, filename);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

const generateNotesHandler = async (req, res) => {
  const collectionId = requireCollection(req, res);
  if (!collectionId) return;
  const { videoIds } = req.body;

  if (!fs.existsSync(SETTINGS_FILE))
    return res.status(400).json({ error: "Settings not configured" });

  try {
    const result = await generateNotes(collectionId, videoIds);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { getNotesHandler, renameNoteHandler, downloadNoteHandler, deleteNoteHandler, generateNotesHandler };
