import axios from "axios";
import { API_BASE } from "../constants/api";

export const getVideos = () => axios.get(`${API_BASE}/videos`);

export const uploadVideos = (formData) =>
  axios.post(`${API_BASE}/upload`, formData);

export const deleteVideoById = (id) =>
  axios.delete(`${API_BASE}/videos/${id}`);

export const renameVideo = (id, originalName) =>
  axios.patch(`${API_BASE}/videos/${id}`, { originalName });

export const reorderVideos = (order) =>
  axios.post(`${API_BASE}/videos/reorder`, { order });

export const openFolderPath = (folderPath) =>
  axios.post(`${API_BASE}/open-folder`, { folderPath });
