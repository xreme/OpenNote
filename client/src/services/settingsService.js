import axios from "axios";
import { API_BASE } from "../constants/api";

export const getSettings = () => axios.get(`${API_BASE}/settings`);

export const saveSettings = (settings) =>
  axios.post(`${API_BASE}/settings`, settings);

export const getEncoderPresets = () =>
  axios.get(`${API_BASE}/encoder-presets`);
