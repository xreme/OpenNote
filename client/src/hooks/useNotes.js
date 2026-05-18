import { useState, useCallback, useEffect } from "react";
import {
  getNotes,
  generateNotesForVideos,
  renameNoteFile,
  deleteNoteFile,
} from "../services/notesService";

export default function useNotes(collectionId) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!collectionId) return;
    try {
      const resp = await getNotes(collectionId);
      setNotes(resp.data);
    } catch (err) {
      console.error("Failed to fetch notes");
    }
  }, [collectionId]);

  // Reset and refetch when collection changes
  useEffect(() => {
    setNotes([]);
    setSelectedNote(null);
    fetchNotes();
  }, [fetchNotes]);

  const generateNotes = async (videoIds, { onSuccess } = {}) => {
    if (!videoIds || !videoIds.length || !collectionId) return;
    setGenerating(true);
    try {
      const resp = await generateNotesForVideos(videoIds, collectionId);
      await fetchNotes();
      if (onSuccess) onSuccess(resp.data);
    } catch (err) {
      alert(err.response?.data?.error || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const renameNote = async (filename, newFilename, { onRenamed } = {}) => {
    try {
      const resp = await renameNoteFile(filename, newFilename, collectionId);
      await fetchNotes();
      if (onRenamed) onRenamed(resp.data.newFilename);
    } catch (err) {
      alert("Failed to rename note: " + (err.response?.data?.error || err.message));
    }
  };

  const deleteNote = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNoteFile(filename, collectionId);
      setNotes((prev) => prev.filter((n) => n.filename !== filename));
      if (selectedNote?.filename === filename) setSelectedNote(null);
    } catch (err) {
      alert("Failed to delete note: " + (err.response?.data?.error || err.message));
    }
  };

  return {
    notes,
    setNotes,
    selectedNote,
    setSelectedNote,
    generating,
    fetchNotes,
    generateNotes,
    renameNote,
    deleteNote,
  };
}
