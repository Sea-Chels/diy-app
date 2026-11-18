import { AREAS, type AreaId } from '../data/areas';
import { BOOK } from '../data/guides';
import { PLANTS } from '../data/plants';
import type { Setup } from '../data/setup';
import { select, store } from '../store';
import { h } from '../../shared/dom';
import { icon } from '../../shared/icons';
import { mountGuidePanel } from '../../shared/ui/guidePanel';
import { guideCard } from './guideCard';
import { openPlantGuide } from './plantGuide';
import { openPlanner } from './planner';

/** The guide that matches what the model is showing goes first. */
const SETUP_GUIDE: { [A in AreaId]?: (s: Setup) => string } = {
  bed: (s) => ({ hugel: 'hugelkultur', lasagna: 'lasagna-bed', mix: 'soil-mix' })[s.fill],
  hydro: (s) => ({ tower: 'pvc-tower', nft: 'nft-rack', dwc: 'dwc-tote' })[s.hydro],
};

export function mountPanel(root: HTMLElement): void {
  mountGuidePanel(root, {
    store,
    select,
    info: (area) => AREAS[area],
    guides: (area) => BOOK.forSpot(area),
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
  });
}
