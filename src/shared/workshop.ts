import type { GuideBase, GuideBook } from './guides';
import { announce } from './announce';
import { h, clear } from './dom';
import { keepFocus } from './focus';
import { media } from './media';
import { press } from './ui/choices';
import type { Selection, Store } from './store';

export interface WorkshopScene<S extends string> {
  onSelect(cb: (spot: S | null) => void): void;
  onHover(cb: (spot: S | null) => void): void;
  focus(spot: S | null): void;
}

export interface WorkshopOpts<S extends string, G extends GuideBase<S>, St extends Selection<S>> {
  scene: WorkshopScene<S>;
  store: Store<St>;
  /** Select a spot and optionally open one of its guides; null clears both. */
  select: (spot: S | null, openGuide?: string | null) => void;
  book: GuideBook<S, G>;
  label: (spot: S) => string;
  isSpot: (id: string) => id is S;
  /** The spots a keyboard can pick from, since the model can't take focus. */
  spots: {
    label: string;
    ids: (s: St) => readonly S[];
  };
  quick: {
    /** The quick-fix bar's guides for the current state. */
    featured: (s: St) => G[];
    more: string;
    openIndex: () => void;
    /** State changes that change which guides are featured. */
    refresh?: (s: St, prev: St) => boolean;
  };
  /** Camera moves beyond following the selection (the garage flies to a ride with nothing selected). */
  refocus?: (s: St, prev: St) => boolean;
  /** Deep links other than a guide or spot id. */
  hash?: (id: string) => void;
}

/**
 * The wiring every workshop page shares: scene picks and hover hints, the camera following
 * the selection, the URL hash (#guide-id or #spot-id) both ways, and the quick-fix bar.
 */
export function wireWorkshop<S extends string, G extends GuideBase<S>, St extends Selection<S>>(o: WorkshopOpts<S, G, St>): void {
  const { scene, store, select, book } = o;

  scene.onSelect((spot) => {
    if (spot !== store.getState().selected) select(spot);
  });

  const hint = document.getElementById('hint')!;
  const idle = hint.textContent ?? '';
  scene.onHover((spot) => {
    hint.textContent = spot ? o.label(spot) : idle;
    hint.classList.toggle('active', Boolean(spot));
  });

  const quick = document.getElementById('quick-fixes')!;
  function renderQuickFixes(): void {
    clear(quick);
    for (const g of o.quick.featured(store.getState())) quick.append(h('button', { class: 'quick-chip', onClick: () => select(g.spots[0], g.id) }, g.title));
    quick.append(h('button', { class: 'quick-chip more', onClick: o.quick.openIndex }, o.quick.more));
  }

  const spotNav = h('nav', { class: 'quick-fixes spot-nav', 'aria-label': o.spots.label });
  quick.before(spotNav);
  let listed = '';
  function syncSpots(s: St): void {
    const ids = o.spots.ids(s);
    if (ids.join() !== listed) {
      listed = ids.join();
      keepFocus(spotNav, () => {
        clear(spotNav);
        for (const id of ids) spotNav.append(h('button', { class: 'quick-chip', 'data-key': id, onClick: () => select(id === store.getState().selected ? null : id) }, o.label(id)));
      });
    }
    for (const b of spotNav.querySelectorAll<HTMLButtonElement>('button')) press(b, b.dataset.key === s.selected);
  }

  // A phone's bottom sheet covers the lower overlays; inert keeps Tab from reaching what can't be seen.
  const panel = document.getElementById('panel')!;
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
      if (s.selected) announce(o.label(s.selected));
    }
    if (s.selected !== prev.selected || o.refocus?.(s, prev)) scene.focus(s.selected);
    if (s.selected !== prev.selected || s.openGuide !== prev.openGuide) {
      const hash = s.openGuide ?? s.selected;
      history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);
    }
    if (o.quick.refresh?.(s, prev)) renderQuickFixes();
  });
  renderQuickFixes();
  syncSpots(store.getState());

  function applyHash(): void {
    const id = location.hash.slice(1);
    if (!id) {
      select(null);
      return;
    }
    const guide = book.byId.get(id);
    if (guide) select(guide.spots[0], guide.id);
    else if (o.isSpot(id)) select(id);
    else o.hash?.(id);
  }
  window.addEventListener('hashchange', applyHash);
  if (location.hash) applyHash();
}
