const express = require("express");
const router = express.Router();
const { getNotesHandler, renameNoteHandler, downloadNoteHandler, deleteNoteHandler, generateNotesHandler, createNoteHandler, updateNoteHandler } = require("../controllers/notesController");

router.get("/", getNotesHandler);
router.post("/", createNoteHandler);
router.put("/:filename", updateNoteHandler);
router.patch("/:filename", renameNoteHandler);
router.get("/:filename/download", downloadNoteHandler);
router.delete("/:filename", deleteNoteHandler);

module.exports = router;
