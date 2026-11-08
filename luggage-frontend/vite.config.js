import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, calls to /api go to the backend on port 5000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // fixed, because the shared login page (student site, 5173) sends staff here
    strictPort: true,
    proxy: { '/api': 'http://localhost:5000' },
  },
})
