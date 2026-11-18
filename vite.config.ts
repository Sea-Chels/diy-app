import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// The loading screen is inlined into every page so it shows before any JS or CSS arrives.
const LOADER: Record<string, { verb: string; what: string; color: string }> = {
  pc: { verb: 'Booting', what: 'the PC', color: '#6ee7ff' },
  garden: { verb: 'Growing', what: 'the garden', color: '#4ade80' },
  home: { verb: 'Unlocking', what: 'the house', color: '#ffd23f' },
  hub: { verb: 'Opening', what: 'the workshop', color: '#ff4fd8' },
};
function loaderPlugin(): Plugin {
  const file = resolve(import.meta.dirname, 'src/shared/loader.html');
  return {
    name: 'diy-loader',
    transformIndexHtml(html, ctx) {
      const page = ['pc', 'garden', 'home'].find((p) => ctx.path.includes(`/${p}/`)) ?? 'hub';
      const l = LOADER[page];
      const markup = readFileSync(file, 'utf8').replace('__VERB__', l.verb).replace('__WHAT__', l.what).replace('__COLOR__', l.color);
      return html.replace(/<body([^>]*)>/, `<body$1>\n${markup}`);
    },
  };
}

// GitHub Pages serves project sites from /<repo-name>/. Set VITE_BASE in CI
// (the deploy workflow does this) or leave unset for local dev.
// Each workshop is its own page so sections can be added without a router.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [loaderPlugin()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900, // three.js is most of it
    rollupOptions: {
      input: {
        hub: resolve(import.meta.dirname, 'index.html'),
        pc: resolve(import.meta.dirname, 'pc/index.html'),
        garden: resolve(import.meta.dirname, 'garden/index.html'),
        home: resolve(import.meta.dirname, 'home/index.html'),
      },
    },
  },
});
