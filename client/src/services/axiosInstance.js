import axios from "axios";

export const PASSWORD_KEY = "app_password";

const api = axios.create();

api.interceptors.request.use((config) => {
  const password = localStorage.getItem(PASSWORD_KEY);
  if (password) config.headers["x-app-password"] = password;
  return config;
});

// On 401, clear stored password and signal the gate to re-lock
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(PASSWORD_KEY);
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  }
);

export default api;
