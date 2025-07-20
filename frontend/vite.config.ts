import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['57e6116b1724.ngrok-free.app'],
  },
  envPrefix: 'VITE_', // Ensure Vite exposes VITE_ prefixed environment variables
})