import type { GuideBase } from '../guides';
import { h, clear } from '../dom';
import { keepFocus } from '../focus';
import { openModal, closeModal } from '../modal';
import { chip } from './choices';

export interface GuideFilter<G> {
  label: string;
  keep: (g: G) => boolean;
}

/** "Everything", then one chip per guide kind. */
export function kindFilters<K extends string, G extends GuideBase & { kind: K }>(kinds: Record<K, string>): GuideFilter<G>[] {
  return [{ label: 'Everything', keep: () => true }, ...(Object.keys(kinds) as K[]).map((k) => ({ label: kinds[k], keep: (g: G) => g.kind === k }))];
}

export interface GuideIndexOpts<Z extends string, G extends GuideBase> {
  guides: G[];
  /** Chips that narrow the list, one active at a time; the first is active on open. */
  filters: GuideFilter<G>[];
  /** An on/off chip at the end of the row, on when the index opens; `keep` applies while it's on. */
  toggle?: { label: (on: boolean) => string; keep: (g: G) => boolean };
  title?: string;
  /** The sections, in order, and each guide's section. */
  zones: readonly Z[];
  zoneLabel: (z: Z) => string;
  zoneOf: (g: G) => Z;
  /** Words to search on top of the title, aliases and summary. */
  searchWords: (g: G) => string[];
  chips: (g: G) => HTMLElement;
  onPick: (g: G) => void;
  placeholder: string;
  empty: string;
  sub: string;
}

/** Every guide, searchable and filterable. */
export function openGuideIndex<Z extends string, G extends GuideBase>(o: GuideIndexOpts<Z, G>): void {
  let query = '';
  let filter = o.filters[0];
  let toggled = true;

  const input = h('input', { type: 'search', placeholder: o.placeholder, 'aria-label': 'Search guides', autocomplete: 'off' });
  const results = h('div', { class: 'index-results' });
  const chips = h('div', { class: 'filter-row' });

  const renderChips = () => keepFocus(chips, renderChipsNow);
  function renderChipsNow(): void {
    clear(chips);
    chips.append(...o.filters.map((f) => chip(f.label, filter === f, () => { filter = f; renderAll(); })));
    if (o.toggle) chips.append(h('span', { class: 'spacer' }), chip(o.toggle.label(toggled), toggled, () => { toggled = !toggled; renderAll(); }));
  }

  function matches(g: G, q: string): boolean {
    if (!q) return true;
    const hay = [g.title, ...g.aliases, ...o.searchWords(g), g.summary].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function renderResults(): void {
    clear(results);
    const q = query.trim().toLowerCase();
    const byZone = new Map<Z, G[]>();
    let count = 0;
    for (const g of o.guides) {
      if (!filter.keep(g) || (o.toggle && toggled && !o.toggle.keep(g))) continue;
      if (!matches(g, q)) continue;
      const z = o.zoneOf(g);
      byZone.set(z, [...(byZone.get(z) ?? []), g]);
      count++;
    }
    if (!count) {
      results.append(h('p', { class: 'muted' }, o.empty));
      return;
    }
    for (const z of o.zones) {
      const list = byZone.get(z);
      if (!list) continue;
      results.append(h('h3', { class: 'section-label' }, o.zoneLabel(z)));
      for (const g of list) {
        results.append(
          h('button', { class: `index-item diff-${g.difficulty}`, onClick: () => { closeModal(); o.onPick(g); } },
            h('span', { class: 'guide-title' }, g.title), o.chips(g), h('span', { class: 'muted small' }, g.summary)),
        );
      }
    }
  }

  function renderAll(): void {
    renderChips();
    renderResults();
  }

  input.addEventListener('input', () => { query = input.value; renderResults(); });
  openModal({ title: o.title ?? 'Every guide', sub: o.sub, className: 'index-modal', body: h('div', { class: 'modal-body' }, input, chips, results) });
  renderAll();
  input.focus();
}
