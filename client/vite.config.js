import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Set VITE_BASE_PATH at build time to serve under a sub-path (e.g. /opennote/).
  // Defaults to '/' so local dev and Docker builds are unchanged.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/videos': 'http://localhost:5001',
      '/upload': 'http://localhost:5001',
      '/settings': 'http://localhost:5001',
      '/notes': 'http://localhost:5001',
      '/generate-notes': 'http://localhost:5001',
      '/open-folder': 'http://localhost:5001',
      '/processed': 'http://localhost:5001',
      '/chat': 'http://localhost:5001',
      '/collections': 'http://localhost:5001',
    },
  },
})
