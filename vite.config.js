import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // bind to 0.0.0.0 so phones on same WiFi can connect
    port: 5173,
    open: false,   // launch.sh handles browser opening
  },
})
