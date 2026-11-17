import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// GitHub Pages serves project sites from /<repo-name>/. Set VITE_BASE in CI
// (the deploy workflow does this) or leave unset for local dev.
// Each workshop is its own page so sections can be added without a router.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900, // three.js is most of it
    rollupOptions: {
      input: {
        hub: resolve(import.meta.dirname, 'index.html'),
        pc: resolve(import.meta.dirname, 'pc/index.html'),
      },
    },
  },
});
