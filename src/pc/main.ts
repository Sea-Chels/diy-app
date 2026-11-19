import '../shared/base.css';
import '../shared/workshop.css';
import './pc.css';
import { createScene } from './scene/scene';
import { PARTS, PART_ORDER } from './data/parts';
import { BOOK, KIND_LABEL } from './data/guides';
import { CATEGORY_PLURAL, PPP_CATEGORY } from './data/catalog';
import { select, store } from './store';
import { mountRigMenu } from './ui/rigMenu';
import { openBuilder } from './ui/builder';
import { PART_CATEGORY, specsFor } from './ui/context';
import { guideCard, guideChips } from './ui/guideCard';
import { h } from '../shared/dom';
import { icon } from '../shared/icons';
import { kindFilters } from '../shared/ui/guideIndex';
import { mountWorkshop } from '../shared/workshop';

// Deep links: #install-windows or #gpu
mountWorkshop({
  store,
  select,
  book: BOOK,
  spots: PARTS,
  order: PART_ORDER,
  spotNav: { label: 'Parts' },
  applies: (g, s) => !g.cooling || g.cooling.includes(s.setup.cooling),
  scene: (canvas, s) => createScene(canvas, s.setup, specsFor(s.build)),
  sync: (scene, s, prev) => {
    if (s.setup !== prev.setup) scene.setSetup(s.setup);
    if (s.build !== prev.build) scene.setSpecs(specsFor(s.build));
  },
  menus: { 'rig-menu': mountRigMenu },
  actions: { 'builder-btn': () => openBuilder() },
  panel: {
    card: guideCard,
    extras: (part) => {
      const cat = PART_CATEGORY[part];
      return cat ? [h('div', { class: 'panel-links' },
        h('a', { class: 'link-chip', href: `https://pcpartpicker.com/products/${PPP_CATEGORY[cat]}/`, target: '_blank', rel: 'noopener noreferrer' }, `Compare ${CATEGORY_PLURAL[cat]} on PCPartPicker`, icon('external', 13)),
        h('button', { class: 'link-chip', onClick: () => openBuilder(cat) }, icon('list', 14), 'Check fit in the parts picker'))] : [];
    },
    relatedLabel: 'Related',
    // The build names the part in each guide's video search.
    refresh: (s, prev) => s.build !== prev.build || s.setup.cooling !== prev.setup.cooling,
  },
  index: {
    filters: kindFilters(KIND_LABEL),
    chips: guideChips,
    placeholder: 'Search: no post, bios, xmp, thermal paste, install windows…',
    empty: 'No guides match. Try a broader word.',
    sub: (n) => `${n} guides: troubleshooting, replacing parts, BIOS and OS setup.`,
  },
  more: 'All guides…',
});
