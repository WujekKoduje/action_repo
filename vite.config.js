import { defineConfig } from 'vite';

// Relative base keeps the build portable: it works when served from the domain
// root, from a GitHub Pages project path (/action_repo/), or from `vite preview`.
export default defineConfig({
  base: './',
  build: {
    target: 'es2018',
    assetsInlineLimit: 2048,
  },
});
