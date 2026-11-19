import type { GuideBase } from '../guides';
import { h, clear } from '../dom';
import { panelFocus } from '../focus';
import { icon } from '../icons';
import { scrollBehavior } from '../motion';
import type { Store, Selection } from '../store';

export interface SpotInfo<S extends string> {
  label: string;
  blurb: string;
  /** Spots whose guides are listed after this one's. */
  related?: readonly S[];
}

export interface GuidePanelOpts<S extends string, G extends GuideBase<S>, St extends Selection<S>> {
  store: Store<St>;
  select: (spot: S | null) => void;
  info: (spot: S) => SpotInfo<S>;
  /** A spot's guides as the current state shows them. */
  guides: (spot: S, s: St) => G[];
  /** The selected spot's own guides, when they're ordered differently from `guides`. */
  primary?: (spot: S, s: St) => G[];
  card: (g: G, open: boolean) => HTMLElement;
  /** Links between the header and the guides. */
  extras?: (spot: S, s: St) => (HTMLElement | null)[];
  /** A label over the spot's own guides; without one they start straight under the header. */
  heading?: string;
  relatedLabel: string;
  /** Shown when a spot has no guides at all. */
  empty?: (s: St) => string;
  /** State changes other than the selection and open guide that change what the panel shows. */
  refresh?: (s: St, prev: St) => boolean;
}

/** The side panel: the selected spot, its guides, then guides from related spots. */
export function mountGuidePanel<S extends string, G extends GuideBase<S>, St extends Selection<S>>(root: HTMLElement, o: GuidePanelOpts<S, G, St>): void {
  const close = () => o.select(null);
  const focus = panelFocus(root, close);

  function draw(): void {
    const s = o.store.getState();
    const { selected, openGuide } = s;
    clear(root);
    root.classList.toggle('open', Boolean(selected));
    if (!selected) return;

    const info = o.info(selected);
    const primary = (o.primary ?? o.guides)(selected, s);
    const seen = new Set(primary.map((g) => g.id));
    const related: G[] = [];
    for (const rel of info.related ?? []) {
      for (const g of o.guides(rel, s)) {
        if (seen.has(g.id)) continue;
        seen.add(g.id);
        related.push(g);
      }
    }

    root.append(
      h('header', { class: 'panel-head' },
        h('div', {}, h('h2', {}, info.label), h('p', { class: 'muted' }, info.blurb)),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: close }, icon('close'))),
      ...(o.extras?.(selected, s) ?? []).filter((e): e is HTMLElement => Boolean(e)),
    );

    const list = h('div', { class: 'guide-list' });
    if (!primary.length && !related.length && o.empty) list.append(h('p', { class: 'muted' }, o.empty(s)));
    if (o.heading) list.append(h('h3', { class: 'section-label' }, o.heading));
    for (const g of primary) list.append(o.card(g, g.id === openGuide));
    if (related.length) {
      list.append(h('h3', { class: 'section-label' }, o.relatedLabel));
      for (const g of related) list.append(o.card(g, g.id === openGuide));
    }
    root.append(list);

    if (openGuide) {
      requestAnimationFrame(() => {
        const card = root.querySelector<HTMLElement>('.guide-card.open');
        // Leaves the header and the card before it in view.
        if (card) root.scrollTo({ top: Math.max(0, card.offsetTop - 120), behavior: scrollBehavior() });
      });
    }
  }

  o.store.subscribe((s, prev) => {
    if (s.selected !== prev.selected || s.openGuide !== prev.openGuide || o.refresh?.(s, prev)) focus(draw);
  });
  focus(draw);
}
