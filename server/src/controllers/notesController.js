const fs = require("fs");
const { listNotes, renameNote, deleteNote, getNoteFilePath, generateNotes } = require("../services/notesService");
const { SETTINGS_FILE } = require("../config");

const getNotesHandler = (req, res) => {
  res.json(listNotes());
};

const renameNoteHandler = (req, res) => {
  const { filename } = req.params;
  const { newFilename } = req.body;

  if (!newFilename)
    return res.status(400).json({ error: "New filename required" });

  try {
    const newName = renameNote(filename, newFilename);
    res.json({ success: true, newFilename: newName });
  } catch (err) {
    console.error("Renaming failed:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

const downloadNoteHandler = (req, res) => {
  const { filename } = req.params;
  const filePath = getNoteFilePath(filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/markdown');
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download failed:", err);
        if (!res.headersSent) res.status(500).send("Could not download file");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
};

const deleteNoteHandler = (req, res) => {
  const { filename } = req.params;
  try {
    deleteNote(filename);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

const generateNotesHandler = async (req, res) => {
  const { videoIds } = req.body;

  if (!fs.existsSync(SETTINGS_FILE))
    return res.status(400).json({ error: "Settings not configured" });

  try {
    const result = await generateNotes(videoIds);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { getNotesHandler, renameNoteHandler, downloadNoteHandler, deleteNoteHandler, generateNotesHandler };
