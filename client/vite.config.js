import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/videos': 'http://localhost:5001',
      '/upload': 'http://localhost:5001',
      '/settings': 'http://localhost:5001',
      '/notes': 'http://localhost:5001',
      '/generate-notes': 'http://localhost:5001',
      '/open-folder': 'http://localhost:5001',
      '/processed': 'http://localhost:5001',
      '/chat': 'http://localhost:5001',
    },
  },
})
