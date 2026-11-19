import '../shared/base.css';
import '../shared/workshop.css';
import './home.css';
import { createScene } from './scene/scene';
import { AREAS, AREA_ORDER, type AreaId } from './data/areas';
import { BOOK, KIND_LABEL, type Guide } from './data/guides';
import type { Setup } from './data/setup';
import { select, store } from './store';
import { mountHomeMenu } from './ui/homeMenu';
import { openToolbox } from './ui/toolbox';
import { openCalculators, type CalcTab } from './ui/calculators';
import { guideCard, guideChips } from './ui/guideCard';
import { h } from '../shared/dom';
import { icon, type IconName } from '../shared/icons';
import { kindFilters } from '../shared/ui/guideIndex';
import { mountWorkshop } from '../shared/workshop';

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

// Deep links: #running-toilet or #toilet
mountWorkshop({
  store,
  select,
  book: BOOK,
  spots: AREAS,
  order: AREA_ORDER,
  spotNav: { label: 'Areas' },
  scene: (canvas, s) => createScene(canvas, s.setup),
  sync: (scene, s, prev) => {
    if (s.setup !== prev.setup) scene.setSetup(s.setup);
  },
  menus: { 'home-menu': mountHomeMenu },
  actions: { 'toolbox-btn': openToolbox, 'calc-btn': () => openCalculators() },
  panel: {
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
  },
  index: {
    filters: kindFilters(KIND_LABEL),
    chips: guideChips,
    placeholder: 'Search: toilet, outlet, caulk, drywall, lead paint…',
    empty: 'No guides match. Try a broader word like faucet, door or paint.',
    sub: (n) => `${n} guides: troubleshooting, installing and replacing, patching and finishing, and upkeep.`,
  },
  more: 'All guides…',
});
