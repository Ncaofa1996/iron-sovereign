import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PWA manifest shortcuts — wire into VitePWA({ manifest: { shortcuts } }) when vite-plugin-pwa is installed
const pwaManifestShortcuts = [
  {
    name: "Daily Log",
    short_name: "Log",
    description: "Submit today's training log",
    url: "/?tab=battle",
    icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
  },
  {
    name: "Journey",
    short_name: "Journey",
    description: "View progress charts",
    url: "/?tab=journey",
    icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
  },
  {
    name: "Quests",
    short_name: "Quests",
    description: "View active quests",
    url: "/?tab=quests",
    icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
  }
]

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // bind to 0.0.0.0 so phones on same WiFi can connect
    port: 5173,
    open: false,   // launch.sh handles browser opening
  },
  // pwaManifestShortcuts available above for future VitePWA integration
})
