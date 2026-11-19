import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { paletteCss } from './src/shared/theme.ts';

/** Each workshop is its own page, so sections can be added without a router. The loading screen names it. */
const PAGES = {
  hub: { html: 'index.html', verb: 'Opening', what: 'the workshop', art: 'hub/garden.webp' },
  pc: { html: 'pc/index.html', verb: 'Booting', what: 'the PC', art: 'hub/pc-loop.webp' },
  garden: { html: 'garden/index.html', verb: 'Growing', what: 'the garden', art: 'hub/garden.webp' },
  home: { html: 'home/index.html', verb: 'Unlocking', what: 'the house', art: 'hub/home.webp' },
  garage: { html: 'garage/index.html', verb: 'Starting', what: 'the car', art: 'hub/garage.webp' },
};
type Page = keyof typeof PAGES;
const pages = Object.keys(PAGES) as Page[];
const at = (path: string) => resolve(import.meta.dirname, path);
// The deploy workflow sets this; link previews need absolute URLs, so local builds go without og:image and og:url.
const SITE = process.env.VITE_SITE_URL;

/** Link-preview tags built from the page's own title and description. */
function previewTags(html: string, page: Page): HtmlTagDescriptor[] {
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? 'DIY';
  const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
  // Open Graph keys go in `property`, Twitter's in `name`.
  const meta = (key: string, content: string): HtmlTagDescriptor => ({ tag: 'meta', attrs: { [key.startsWith('og:') ? 'property' : 'name']: key, content }, injectTo: 'head' });
  const tags = [meta('og:type', 'website'), meta('og:site_name', 'DIY'), meta('og:title', title), meta('og:description', description), meta('twitter:card', 'summary_large_image')];
  if (SITE) {
    const dir = page === 'hub' ? '' : `${page}/`;
    tags.push(meta('og:url', new URL(dir, SITE).href), meta('og:image', new URL(PAGES[page].art, SITE).href));
  }
  return tags;
}

/** Inlines the palette and loading screen into every page, so they apply before any JS or CSS arrives. */
function loaderPlugin(): Plugin {
  const loader = readFileSync(at('src/shared/loader.html'), 'utf8');
  return {
    name: 'diy-loader',
    transformIndexHtml(html, ctx) {
      const page = pages.find((p) => p !== 'hub' && ctx.path.includes(`/${p}/`)) ?? 'hub';
      const { verb, what } = PAGES[page];
      const markup = loader.replace('__VERB__', verb).replace('__WHAT__', what).replace('__PAGE__', page);
      return {
        html: html.replace(/<body([^>]*)>/, `<body$1>\n${markup}`),
        tags: [{ tag: 'style', children: paletteCss(), injectTo: 'head-prepend' }, ...previewTags(html, page)],
      };
    },
  };
}

export default defineConfig({
  // GitHub Pages serves project sites from /<repo-name>/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE ?? '/',
  plugins: [loaderPlugin()],
  // Fixed so it never lands on another local project's dev server.
  server: { port: 4318, strictPort: true },
  css: { transformer: 'lightningcss', lightningcss: { drafts: { customMedia: true } } },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 700, // three.js on its own is about 640 kB
    rolldownOptions: {
      input: Object.fromEntries(pages.map((p) => [p, at(PAGES[p].html)])),
      output: {
        // three.js changes far less often than the workshops, so it caches on its own.
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] },
      },
    },
  },
});
