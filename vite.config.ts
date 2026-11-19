import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { PALETTE, paletteCss } from './src/shared/theme.ts';

/** A topbar button: id, icon, label, and a shorter label for phones. */
type Action = [id: string, icon: string, label: string, short?: string];
/** What a workshop page adds to the shared shell in src/shared/workshop.html. */
interface Shell {
  title: string;
  description: string;
  crumb: string;
  /** The canvas's accessible description. */
  scene: string;
  menu: string;
  quick: string;
  actions: Action[];
  /** Replaces the spacer between the brand and the actions. */
  tools?: string;
  /** More overlays on the stage, after the scene menu. */
  overlays?: string;
}

interface PageDef {
  html: string;
  verb: string;
  what: string;
  /** The link-preview image. */
  art: string;
  shell?: Shell;
}

/** Each workshop is its own page, so sections can be added without a router. The loading screen names it. */
const PAGES = {
  hub: { html: 'index.html', verb: 'Opening', what: 'the workshop', art: 'hub/garden.webp' },
  pc: {
    html: 'pc/index.html', verb: 'Booting', what: 'the PC', art: 'hub/pc-loop.webp',
    shell: {
      title: 'PC Workshop', crumb: 'PC', menu: 'rig-menu', quick: 'Popular guides',
      description: 'Click a part of the PC to troubleshoot or replace it, walk through BIOS and OS setup, and check your parts fit together.',
      scene: 'Interactive PC. Click a part to see how to fix or replace it.',
      actions: [['builder-btn', 'list', 'Parts picker'], ['guides-btn', 'book', 'Guides']],
    },
  },
  garden: {
    html: 'garden/index.html', verb: 'Growing', what: 'the garden', art: 'hub/garden.webp',
    shell: {
      title: 'Garden Workshop', crumb: 'Garden', menu: 'garden-menu', quick: 'Popular guides',
      description: 'Click around a comic garden: build and fill raised beds, companion planting, compost, hydroponics, preserving the harvest and care for dozens of plants.',
      scene: 'Interactive garden. Click an area to see how to build, grow or fix it.',
      actions: [['plants-btn', 'sprout', 'Plant guide', 'Plants'], ['planner-btn', 'list', 'Bed planner', 'Planner'], ['guides-btn', 'book', 'Guides']],
    },
  },
  home: {
    html: 'home/index.html', verb: 'Unlocking', what: 'the house', art: 'hub/home.webp',
    shell: {
      title: 'Home Workshop', crumb: 'Home', menu: 'home-menu', quick: 'Popular guides',
      description: 'Click around a comic cutaway house: fix toilets, faucets and drains, swap outlets, switches, lights and fans, patch drywall, replace counters, windows and doors, and strip paint from wood.',
      scene: 'Interactive cutaway house. Click a fixture to see how to fix, replace or install it.',
      actions: [['toolbox-btn', 'toolbox', 'Toolbox', 'Tools'], ['calc-btn', 'calc', 'Calculators', 'Calc'], ['guides-btn', 'book', 'Guides']],
    },
  },
  garage: {
    html: 'garage/index.html', verb: 'Starting', what: 'the car', art: 'hub/garage.webp',
    shell: {
      title: 'Garage', crumb: 'Garage', menu: 'paint-shop', quick: 'Quick fixes',
      description: 'Click a part of the car, motorcycle or bike, see what you can fix yourself, and watch how-to videos for your exact make, model and year.',
      scene: 'Interactive garage with a car, a motorcycle and a bike. Click a part to see what you can fix.',
      actions: [['guides-btn', 'book', 'Glossary']],
      tools: '<div class="picker" id="vehicle-picker"></div>',
      overlays: '<div class="scene-menu seg ride-switch" id="ride-switch" role="group" aria-label="Vehicle"></div>',
    },
  },
} satisfies Record<string, PageDef>;
type Page = keyof typeof PAGES;
const pages = Object.keys(PAGES) as Page[];
const at = (path: string) => resolve(import.meta.dirname, path);
// The deploy workflow sets this; link previews need absolute URLs, so local builds go without og:image and og:url.
const SITE = process.env.VITE_SITE_URL;
const pageOf = (path: string): Page => pages.find((p) => p !== 'hub' && path.includes(`/${p}/`)) ?? 'hub';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/__([A-Z]+)__/g, (m, k: string) => vars[k.toLowerCase()] ?? m);

/** The browser-chrome color, and link-preview tags built from the page's own title and description. */
function previewTags(html: string, page: Page): HtmlTagDescriptor[] {
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? 'DIY';
  const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
  // Open Graph keys go in `property`, Twitter's in `name`.
  const meta = (key: string, content: string): HtmlTagDescriptor => ({ tag: 'meta', attrs: { [key.startsWith('og:') ? 'property' : 'name']: key, content }, injectTo: 'head' });
  const tags = [meta('theme-color', PALETTE.bgDeep), meta('og:type', 'website'), meta('og:site_name', 'DIY'), meta('og:title', title), meta('og:description', description), meta('twitter:card', 'summary_large_image')];
  if (SITE) {
    const dir = page === 'hub' ? '' : `${page}/`;
    tags.push(meta('og:url', new URL(dir, SITE).href), meta('og:image', new URL(PAGES[page].art, SITE).href));
  }
  return tags;
}

/** Builds each workshop page from the shared shell, before Vite reads its scripts. Their index.html files are stubs. */
function shellPlugin(): Plugin {
  const tpl = readFileSync(at('src/shared/workshop.html'), 'utf8');
  const button = ([id, name, label, short]: Action) =>
    `          <button id="${id}" class="ghost-btn"><i data-icon="${name}" data-size="16"></i>${short ? `<span class="lbl-long">${label}</span><span class="lbl-short">${short}</span>` : label}</button>\n`;
  return {
    name: 'diy-shell',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = pageOf(ctx.path);
        const { shell: s }: PageDef = PAGES[page];
        if (!s) return html;
        return fill(tpl, {
          page, title: s.title, description: esc(s.description), crumb: s.crumb, scene: esc(s.scene), menu: s.menu, quick: esc(s.quick),
          tools: s.tools ?? '<span class="spacer"></span>',
          actions: s.actions.map(button).join('').trimEnd(),
          overlays: s.overlays ? `          ${s.overlays}\n` : '',
        });
      },
    },
  };
}

/** Inlines the palette and loading screen into every page, so they apply before any JS or CSS arrives. */
function loaderPlugin(): Plugin {
  const loader = readFileSync(at('src/shared/loader.html'), 'utf8');
  return {
    name: 'diy-loader',
    transformIndexHtml(html, ctx) {
      const page = pageOf(ctx.path);
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
  plugins: [shellPlugin(), loaderPlugin()],
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
