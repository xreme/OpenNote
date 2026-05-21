import axios from "./axiosInstance";
import { API_BASE } from "../constants/api";

export const getCollections = () => axios.get(`${API_BASE}/collections`);

export const createCollection = (title) =>
  axios.post(`${API_BASE}/collections`, { title });

export const renameCollection = (id, title) =>
  axios.patch(`${API_BASE}/collections/${id}`, { title });

export const deleteCollection = (id) =>
  axios.delete(`${API_BASE}/collections/${id}`);
