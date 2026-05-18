import axios from "axios";
import { API_BASE } from "../constants/api";

export const getNotes = (collectionId) =>
  axios.get(`${API_BASE}/notes`, { params: { collection: collectionId } });

export const generateNotesForVideos = (videoIds, collectionId) =>
  axios.post(`${API_BASE}/generate-notes`, { videoIds, collectionId });

export const renameNoteFile = (filename, newFilename, collectionId) =>
  axios.patch(`${API_BASE}/notes/${filename}`, { newFilename, collectionId });

export const deleteNoteFile = (filename, collectionId) =>
  axios.delete(`${API_BASE}/notes/${filename}`, { params: { collection: collectionId } });

export const downloadNoteUrl = (filename, collectionId) =>
  `${API_BASE}/notes/${encodeURIComponent(filename)}/download?collection=${collectionId}`;
