import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, calls to /api go to the backend on port 5000.
// (The student site uses port 5173, so this one will usually open on 5174.)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
})
