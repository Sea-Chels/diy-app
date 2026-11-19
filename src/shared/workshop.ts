import type { GuideBase, GuideBook } from './guides';
import { announce } from './announce';
import { h, clear } from './dom';
import { keepFocus } from './focus';
import { hydrateIcons } from './icons';
import { hideLoaderAfterFrames } from './loader';
import { media } from './media';
import { scrollBehavior } from './motion';
import { sceneOr } from './scene/fallback';
import { press } from './ui/choices';
import { mountGuidePanel, type GuidePanelOpts, type SpotInfo } from './ui/guidePanel';
import { openGuideIndex, type GuideIndexOpts } from './ui/guideIndex';
import type { Selection, Store } from './store';

export interface WorkshopScene<S extends string> {
  onSelect(cb: (spot: S | null) => void): void;
  onHover(cb: (spot: S | null) => void): void;
  focus(spot: S | null): void;
}

/** Everything that makes one workshop page: its data, scene, menus and how its guides are shown. */
export interface WorkshopDef<S extends string, G extends GuideBase<S>, St extends Selection<S>, Sc extends WorkshopScene<S>> {
  store: Store<St>;
  /** Select a spot and optionally open one of its guides; null clears both. */
  select: (spot: S | null, openGuide?: string | null) => void;
  book: GuideBook<S, G>;
  /** Every spot: its name, blurb and related spots. */
  spots: Record<S, SpotInfo<S>>;
  /** The spots in guide-index order. */
  order: readonly S[];
  /** The row of spot buttons a keyboard picks from, since the model can't take focus; `ids` when not every spot is on show. */
  spotNav: { label: string; ids?: (s: St) => readonly S[] };
  /** Whether a guide fits the current state. The quick-fix bar, the panel and the index leave out the ones that don't. */
  applies?: (g: G, s: St) => boolean;
  scene: (canvas: HTMLCanvasElement, s: St) => Sc;
  /** Passes state changes on to the scene, before the shared wiring's camera moves. */
  sync?: (scene: Sc, s: St, prev: St) => void;
  /** Floating menus and pickers, by element id. */
  menus: Record<string, (el: HTMLElement, scene: Sc) => void>;
  /** Top-bar buttons beyond the guide index, by element id. */
  actions?: Record<string, () => void>;
  panel: Omit<GuidePanelOpts<S, G, St>, 'store' | 'select' | 'info' | 'guides'>;
  index: Pick<GuideIndexOpts<S, G>, 'title' | 'filters' | 'chips' | 'placeholder' | 'empty'> & {
    sub: (count: number) => string;
    /** Search words beyond each guide's spot names. */
    words?: (g: G) => string[];
    /** List every guide, with an on/off chip (labeled by this) for the ones that apply, instead of leaving the rest out. */
    toggle?: (s: St) => (on: boolean) => string;
  };
  /** The quick-fix bar's last chip, which opens the index. */
  more: string;
  /** Camera moves beyond following the selection (the garage flies to a ride with nothing selected). */
  refocus?: (s: St, prev: St) => boolean;
  /** Deep links other than a guide or spot id. */
  hash?: (id: string) => void;
}

/**
 * Builds a workshop page from its definition: the scene, menus, panel and guide index, then the wiring every page
 * shares: scene picks and hover hints, the camera following the selection, the URL hash (#guide-id or #spot-id)
 * both ways, and the quick-fix bar.
 */
export function mountWorkshop<S extends string, G extends GuideBase<S>, St extends Selection<S>, Sc extends WorkshopScene<S>>(o: WorkshopDef<S, G, St, Sc>): void {
  hydrateIcons();
  const { store, select, book, spots } = o;
  const all = Object.keys(spots) as S[];
  const label = (spot: S) => spots[spot].label;
  const applies = (g: G, s: St) => !o.applies || o.applies(g, s);
  const spotIds = o.spotNav.ids ?? (() => all);

  const canvas = document.getElementById('scene') as HTMLCanvasElement;
  const scene = sceneOr(canvas, () => o.scene(canvas, store.getState()));
  for (const [id, mount] of Object.entries(o.menus)) mount(document.getElementById(id)!, scene);
  const panel = document.getElementById('panel')!;
  mountGuidePanel(panel, { ...o.panel, store, select, info: (spot) => spots[spot], guides: (spot, s) => book.forSpot(spot).filter((g) => applies(g, s)) });

  function openIndex(): void {
    const s = store.getState();
    const { toggle, sub, words, ...rest } = o.index;
    const guides = toggle ? book.all : book.all.filter((g) => applies(g, s));
    openGuideIndex({
      ...rest,
      guides,
      ...(toggle && { toggle: { label: toggle(s), keep: (g: G) => applies(g, s) } }),
      zones: o.order,
      zoneLabel: label,
      zoneOf: (g) => g.spots[0],
      searchWords: (g) => [...g.spots.map(label), ...(words?.(g) ?? [])],
      onPick: (g) => select(g.spots[0], g.id),
      sub: sub(guides.length),
    });
  }
  document.getElementById('guides-btn')!.addEventListener('click', openIndex);
  for (const [id, act] of Object.entries(o.actions ?? {})) document.getElementById(id)!.addEventListener('click', act);
  if (o.sync) store.subscribe((s, prev) => o.sync!(scene, s, prev));

  scene.onSelect((spot) => {
    if (spot !== store.getState().selected) select(spot);
  });

  const hint = document.getElementById('hint')!;
  const idle = hint.textContent ?? '';
  scene.onHover((spot) => {
    hint.textContent = spot ? label(spot) : idle;
    hint.classList.toggle('active', Boolean(spot));
  });

  const quick = document.getElementById('quick-fixes')!;
  const featured = (s: St) => book.all.filter((g) => g.featured && spotIds(s).includes(g.spots[0]) && applies(g, s));
  let shownFixes: string | null = null;
  function renderQuickFixes(s: St): void {
    const list = featured(s);
    const ids = list.map((g) => g.id).join();
    if (ids === shownFixes) return;
    shownFixes = ids;
    clear(quick);
    for (const g of list) quick.append(h('button', { class: 'quick-chip', onClick: () => select(g.spots[0], g.id) }, g.title));
    quick.append(h('button', { class: 'quick-chip more', onClick: openIndex }, o.more));
  }

  const spotNav = h('nav', { class: 'quick-fixes spot-nav', 'aria-label': o.spotNav.label });
  quick.before(spotNav);
  // Chrome doesn't scroll a half-shown control into view on focus, and these rows scroll sideways.
  for (const row of [quick, spotNav]) row.addEventListener('focusin', (e) => (e.target as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: scrollBehavior() }));
  let listed = '';
  function syncSpots(s: St): void {
    const ids = spotIds(s);
    if (ids.join() !== listed) {
      listed = ids.join();
      keepFocus(spotNav, () => {
        clear(spotNav);
        for (const id of ids) spotNav.append(h('button', { class: 'quick-chip', 'data-key': id, onClick: () => select(id === store.getState().selected ? null : id) }, label(id)));
      });
    }
    for (const b of spotNav.querySelectorAll<HTMLButtonElement>('button')) press(b, b.dataset.key === s.selected);
  }

  // A phone's bottom sheet covers the lower overlays; inert keeps Tab from reaching what can't be seen.
  const phone = media('phone');
  function syncCovered(): void {
    const open = phone.matches && Boolean(store.getState().selected);
    const top = panel.offsetParent ? panel.offsetParent.getBoundingClientRect().top + panel.offsetTop : Infinity;
    for (const el of quick.parentElement!.children) {
      if (el instanceof HTMLElement && !(el instanceof HTMLCanvasElement)) el.inert = open && el.getBoundingClientRect().bottom > top;
    }
  }
  phone.addEventListener('change', syncCovered);
  window.addEventListener('resize', syncCovered);

  store.subscribe((s, prev) => {
    syncSpots(s);
    if (s.selected !== prev.selected) {
      syncCovered();
      if (s.selected) announce(label(s.selected));
    }
    if (s.selected !== prev.selected || o.refocus?.(s, prev)) scene.focus(s.selected);
    if (s.selected !== prev.selected || s.openGuide !== prev.openGuide) {
      const hash = s.openGuide ?? s.selected;
      history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);
    }
    renderQuickFixes(s);
  });
  renderQuickFixes(store.getState());
  syncSpots(store.getState());

  function applyHash(): void {
    const id = location.hash.slice(1);
    if (!id) {
      select(null);
      return;
    }
    const guide = book.byId.get(id);
    if (guide) select(guide.spots[0], guide.id);
    else if (Object.hasOwn(spots, id)) select(id as S);
    else o.hash?.(id);
  }
  window.addEventListener('hashchange', applyHash);
  if (location.hash) applyHash();
  hideLoaderAfterFrames();
}
