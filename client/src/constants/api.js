// Empty for root deploys and local dev; "/opennote" when built with
// VITE_BASE_PATH=/opennote/ so API calls sit under the same prefix as the app.
export const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
