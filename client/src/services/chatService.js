import axios from "./axiosInstance";
import { API_BASE } from "../constants/api";

export const sendChatQuery = (query, collectionId) =>
  axios.post(`${API_BASE}/chat`, { query, collectionId });
