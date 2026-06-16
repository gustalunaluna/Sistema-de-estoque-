import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Remove crossorigin attribute — causes Electron file:// protocol issues
function removeCrossorigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin(?:="[^"]*")?/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: false,
  },
  server: {
    // In dev mode, proxy /api calls to the Express server running on port 3000
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
