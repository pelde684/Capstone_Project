import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, calls to /api go to the backend on port 5000.
// `npm run dev:phone` serves the site over https with the certificate in ../certs/dev.pfx,
// so the QR camera works on a phone on the same Wi-Fi (phones only allow the camera on https pages).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5174, // fixed, because the shared login page (student site, 5173) sends staff here
    strictPort: true,
    ...(mode === 'phone' && { https: { pfx: fs.readFileSync('../certs/dev.pfx'), passphrase: 'capstone' } }),
    proxy: { '/api': 'http://localhost:5000' },
  },
}))
