import { AREAS, type AreaId } from '../data/areas';
import { BOOK, type Guide } from '../data/guides';
import type { Setup } from '../data/setup';
import { select, store } from '../store';
import { h } from '../../shared/dom';
import { icon, type IconName } from '../../shared/icons';
import { mountGuidePanel } from '../../shared/ui/guidePanel';
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
  mountGuidePanel(root, {
    store,
    select,
    info: (area) => AREAS[area],
    guides: (area) => BOOK.forSpot(area),
    primary: (area, s) => {
      const lead = SETUP_GUIDE[area]?.(s.setup);
      // Setup lead first, then guides that live here, then ones shared from elsewhere.
      const rank = (g: Guide) => (g.id === lead ? 0 : g.spots[0] === area ? 1 : 2);
      return [...BOOK.forSpot(area)].sort((a, b) => rank(a) - rank(b));
    },
    card: guideCard,
    extras: (area) => {
      const calc = CALC_LINKS[area];
      return calc ? [h('div', { class: 'panel-links' }, h('button', { class: 'link-chip', onClick: () => openCalculators(calc.tab) }, icon(calc.icon, 14), calc.label))] : [];
    },
    heading: 'Guides',
    relatedLabel: 'Related',
    // Owned tools mark each guide's tool list.
    refresh: (s, prev) => s.setup !== prev.setup || s.owned !== prev.owned,
  });
}
