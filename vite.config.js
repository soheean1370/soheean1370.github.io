import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = import.meta.dirname;
const read = (name) => JSON.parse(readFileSync(resolve(root, 'src/content', `${name}.json`), 'utf8'));

/** Bakes src/content/*.json into any page that has a <!--FLAT_CONTENT--> marker,
 *  so all assignment items exist as plain HTML text even without JavaScript. */
function flatContent() {
  return {
    name: 'flat-content',
    async transformIndexHtml(html) {
      if (!html.includes('<!--FLAT_CONTENT-->')) return html;
      const { renderFlat } = await import(`${pathToFileURL(resolve(root, 'src/content/render.js')).href}?t=${Date.now()}`);
      const data = Object.fromEntries(['profile', 'copy', 'projects', 'research', 'stack', 'resume'].map((n) => [n, read(n)]));
      return html.replace('<!--FLAT_CONTENT-->', renderFlat(data));
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/src/content/')) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), flatContent()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        three: resolve(root, '3d.html'),
      },
    },
  },
});
