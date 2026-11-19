import '../shared/base.css';
import '../shared/workshop.css';
import './garden.css';
import { createScene } from './scene/scene';
import { AREAS, AREA_ORDER, type AreaId } from './data/areas';
import { BOOK, KIND_LABEL } from './data/guides';
import { PLANTS, PLANT_BY_ID } from './data/plants';
import type { Setup } from './data/setup';
import { select, store } from './store';
import { mountGardenMenu } from './ui/gardenMenu';
import { openPlantGuide } from './ui/plantGuide';
import { openPlanner } from './ui/planner';
import { guideCard, guideChips } from './ui/guideCard';
import { h } from '../shared/dom';
import { icon } from '../shared/icons';
import { kindFilters } from '../shared/ui/guideIndex';
import { mountWorkshop } from '../shared/workshop';

/** The guide that matches what the model is showing goes first. */
const SETUP_GUIDE: { [A in AreaId]?: (s: Setup) => string } = {
  bed: (s) => ({ hugel: 'hugelkultur', lasagna: 'lasagna-bed', mix: 'soil-mix' })[s.fill],
  hydro: (s) => ({ tower: 'pvc-tower', nft: 'nft-rack', dwc: 'dwc-tote' })[s.hydro],
};

// Deep links: #hot-compost, #compost or #plant=pawpaw
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
  menus: { 'garden-menu': mountGardenMenu },
  actions: { 'plants-btn': () => openPlantGuide(), 'planner-btn': openPlanner },
  panel: {
    primary: (area, s) => {
      const lead = SETUP_GUIDE[area]?.(s.setup);
      return [...BOOK.forSpot(area)].sort((a, b) => Number(b.id === lead) - Number(a.id === lead));
    },
    card: guideCard,
    extras: (area) => {
      const growing = PLANTS.filter((p) => p.area === area);
      return [
        ...(growing.length ? [h('h3', { class: 'section-label' }, 'Growing here'),
          h('div', { class: 'panel-links' }, ...growing.map((p) =>
            h('button', { class: 'link-chip', onClick: () => openPlantGuide(p.id) }, icon('sprout', 13), p.name)))] : []),
        area === 'bed' || area === 'kitchen' ? h('div', { class: 'panel-links' },
          h('button', { class: 'link-chip', onClick: () => openPlanner() }, icon('list', 14), 'Plan a bed: companions & spacing')) : null,
      ];
    },
    heading: 'Guides',
    relatedLabel: 'Related',
    refresh: (s, prev) => s.setup !== prev.setup,
  },
  index: {
    filters: kindFilters(KIND_LABEL),
    words: (g) => g.plants ?? [],
    chips: guideChips,
    placeholder: 'Search: compost, hugelkultur, canning, aphids, pH…',
    empty: 'No guides match. Try a broader word, or look the plant up in the plant guide.',
    sub: (n) => `${n} guides: building beds, growing, fixing problems and preserving the harvest.`,
  },
  more: 'All guides…',
  hash: (id) => {
    const plant = id.startsWith('plant=') ? id.slice(6) : '';
    if (PLANT_BY_ID.has(plant)) openPlantGuide(plant);
  },
});
