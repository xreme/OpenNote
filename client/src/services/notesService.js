import axios from "axios";
import { API_BASE } from "../constants/api";

export const getNotes = () => axios.get(`${API_BASE}/notes`);

export const generateNotesForVideos = (videoIds) =>
  axios.post(`${API_BASE}/generate-notes`, { videoIds });

export const renameNoteFile = (filename, newFilename) =>
  axios.patch(`${API_BASE}/notes/${filename}`, { newFilename });

export const deleteNoteFile = (filename) =>
  axios.delete(`${API_BASE}/notes/${filename}`);
