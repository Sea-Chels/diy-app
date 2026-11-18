import { AREAS, type AreaId } from '../data/areas';
import { guidesForArea, type Guide } from '../data/guides';
import type { Setup } from '../data/setup';
import { getState, setState, subscribe } from '../store';
import { h, clear } from '../../shared/dom';
import { icon, type IconName } from '../../shared/icons';
import { guideCard } from './guideCard';
import { openCalculators, type CalcTab } from './calculators';

/** The guide that matches what the model is showing goes first. */
const SETUP_GUIDE: { [A in AreaId]?: (s: Setup) => string } = {
  counters: (s) => ({ laminate: 'counter-laminate', butcher: 'counter-butcher', quartz: 'counter-stone' })[s.counter],
  lights: (s) => ({ fan: 'install-ceiling-fan', light: 'replace-light-fixture' })[s.ceiling],
  floor: (s) => ({ oak: 'refinish-hardwood', lvp: 'install-lvp', tile: 'replace-cracked-tile' })[s.floor],
};

/** Calculators worth a shortcut from an area. */
const CALC_LINKS: { [A in AreaId]?: { tab: CalcTab; label: string; icon: IconName } } = {
  wall: { tab: 'paint', label: 'How much paint do I need?', icon: 'paint' },
  paint: { tab: 'paint', label: 'How much paint do I need?', icon: 'paint' },
  floor: { tab: 'floor', label: 'How much flooring do I need?', icon: 'calc' },
  outlets: { tab: 'wire', label: 'Wire size and breaker chart', icon: 'zap' },
  utility: { tab: 'wire', label: 'Wire size and breaker chart', icon: 'zap' },
  lights: { tab: 'wire', label: 'Wire size and breaker chart', icon: 'zap' },
};

export function mountPanel(root: HTMLElement): void {
  function render(): void {
    const { selectedArea, openGuide, setup } = getState();
    clear(root);
    root.classList.toggle('open', Boolean(selectedArea));
    if (!selectedArea) return;

    const info = AREAS[selectedArea];
    const lead = SETUP_GUIDE[selectedArea]?.(setup);
    // Setup lead first, then guides that live here, then ones shared from elsewhere.
    const rank = (g: Guide) => (g.id === lead ? 0 : g.areas[0] === selectedArea ? 1 : 2);
    const primary = guidesForArea(selectedArea).sort((a, b) => rank(a) - rank(b));
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
    const calc = CALC_LINKS[selectedArea];
    if (calc) root.append(h('div', { class: 'panel-links' }, h('button', { class: 'link-chip', onClick: () => openCalculators(calc.tab) }, icon(calc.icon, 14), calc.label)));

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
    if (s.selectedArea !== prev.selectedArea || s.openGuide !== prev.openGuide || s.setup !== prev.setup || s.owned !== prev.owned) render();
  });
  render();
}
