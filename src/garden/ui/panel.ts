import { AREAS, type AreaId } from '../data/areas';
import { guidesForArea, type Guide } from '../data/guides';
import { PLANTS } from '../data/plants';
import type { Setup } from '../data/setup';
import { getState, setState, subscribe } from '../store';
import { h, clear } from '../../shared/dom';
import { icon } from '../../shared/icons';
import { guideCard } from './guideCard';
import { openPlantGuide } from './plantGuide';
import { openPlanner } from './planner';

/** The guide that matches what the model is showing goes first. */
const SETUP_GUIDE: { [A in AreaId]?: (s: Setup) => string } = {
  bed: (s) => ({ hugel: 'hugelkultur', lasagna: 'lasagna-bed', mix: 'soil-mix' })[s.fill],
  hydro: (s) => ({ tower: 'pvc-tower', nft: 'nft-rack', dwc: 'dwc-tote' })[s.hydro],
};

export function mountPanel(root: HTMLElement): void {
  function render(): void {
    const { selectedArea, openGuide, setup } = getState();
    clear(root);
    root.classList.toggle('open', Boolean(selectedArea));
    if (!selectedArea) return;

    const info = AREAS[selectedArea];
    const lead = SETUP_GUIDE[selectedArea]?.(setup);
    const primary = guidesForArea(selectedArea).sort((a, b) => Number(b.id === lead) - Number(a.id === lead));
    const seen = new Set(primary.map((g) => g.id));
    const nearby: Guide[] = [];
    for (const rel of info.related ?? []) {
      for (const g of guidesForArea(rel)) {
        if (!seen.has(g.id)) {
          seen.add(g.id);
          nearby.push(g);
        }
      }
    }

    root.append(
      h('header', { class: 'panel-head' },
        h('div', {}, h('h2', {}, info.label), h('p', { class: 'muted' }, info.blurb)),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: () => setState({ selectedArea: null, openGuide: null }) }, icon('close'))),
    );

    const growing = PLANTS.filter((p) => p.area === selectedArea);
    if (growing.length) {
      root.append(h('h3', { class: 'section-label' }, 'Growing here'),
        h('div', { class: 'panel-links' }, ...growing.map((p) =>
          h('button', { class: 'link-chip', onClick: () => openPlantGuide(p.id) }, icon('sprout', 13), p.name))));
    }
    if (selectedArea === 'bed' || selectedArea === 'kitchen') {
      root.append(h('div', { class: 'panel-links' },
        h('button', { class: 'link-chip', onClick: () => openPlanner() }, icon('list', 14), 'Plan a bed: companions & spacing')));
    }

    const list = h('div', { class: 'repair-list' });
    list.append(h('h3', { class: 'section-label' }, 'Guides'));
    for (const g of primary) list.append(guideCard(g, g.id === openGuide));
    if (nearby.length) {
      list.append(h('h3', { class: 'section-label' }, 'Related'));
      for (const g of nearby) list.append(guideCard(g, g.id === openGuide));
    }
    root.append(list);

    if (openGuide) {
      requestAnimationFrame(() => {
        const card = root.querySelector<HTMLElement>('.repair-card.open');
        if (card) root.scrollTo({ top: Math.max(0, card.offsetTop - 120), behavior: 'smooth' });
      });
    }
  }

  subscribe((s, prev) => {
    if (s.selectedArea !== prev.selectedArea || s.openGuide !== prev.openGuide || s.setup !== prev.setup) render();
  });
  render();
}
