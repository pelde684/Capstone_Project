import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // fixed: the staff site sends people back to this login page
    strictPort: true,
    // Browser calls /api/... and Vite forwards it to the backend, so there is no CORS setup to worry about
    proxy: { '/api': 'http://localhost:5000' },
  },
})
