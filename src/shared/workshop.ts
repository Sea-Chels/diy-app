import type { GuideBase, GuideBook } from './guides';
import { h, clear } from './dom';
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

  store.subscribe((s, prev) => {
    if (s.selected !== prev.selected || o.refocus?.(s, prev)) scene.focus(s.selected);
    if (s.selected !== prev.selected || s.openGuide !== prev.openGuide) {
      const hash = s.openGuide ?? s.selected;
      history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);
    }
    if (o.quick.refresh?.(s, prev)) renderQuickFixes();
  });
  renderQuickFixes();

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
