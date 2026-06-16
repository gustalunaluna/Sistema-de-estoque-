import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Remove crossorigin attribute from script/link tags.
// The crossorigin attribute can prevent Electron from loading scripts
// via the file:// protocol (no CORS headers on local files).
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
})
