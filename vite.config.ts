import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Remove crossorigin attribute — needed for Electron file:// protocol
function removeCrossorigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin(?:="[^"]*")?/g, '');
    },
  };
}

// ELECTRON_BUILD=1 → relative base (./) for file:// protocol
// Default (Vercel/web)  → absolute base (/) for proper SPA routing
const isElectronBuild = process.env.ELECTRON_BUILD === '1';

export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  base: isElectronBuild ? './' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: false,
  },
  server: {
    // Dev mode: proxy /api to the local Express server (ignored when using Supabase)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
