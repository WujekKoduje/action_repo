import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

// Relative base keeps the build portable: it works when served from the domain
// root, from a GitHub Pages project path (/action_repo/), or from `vite preview`.
export default defineConfig({
  base: './',
  build: {
    target: 'es2018',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        gallery: resolve(root, 'gallery.html'),
      },
    },
  },
});
