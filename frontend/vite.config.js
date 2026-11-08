import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run dev:phone` serves the site over https with the certificate in ../certs/dev.pfx,
// so a phone on the same Wi-Fi can use it (phones only allow the camera on https pages).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // fixed: the staff site sends people back to this login page
    strictPort: true,
    ...(mode === 'phone' && { https: { pfx: fs.readFileSync('../certs/dev.pfx'), passphrase: 'capstone' } }),
    // Browser calls /api/... and Vite forwards it to the backend, so there is no CORS setup to worry about
    proxy: { '/api': 'http://localhost:5000' },
  },
}))
