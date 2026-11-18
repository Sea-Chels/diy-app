import { PARTS } from '../data/parts';
import { guidesForPart } from '../data/guides';
import { CATEGORY_PLURAL, PPP_CATEGORY } from '../data/catalog';
import { select, store } from '../store';
import { h } from '../../shared/dom';
import { icon } from '../../shared/icons';
import { mountGuidePanel } from '../../shared/ui/guidePanel';
import { PART_CATEGORY } from './context';
import { guideCard } from './guideCard';
import { openBuilder } from './builder';

export function mountPanel(root: HTMLElement): void {
  mountGuidePanel(root, {
    store,
    select,
    info: (part) => PARTS[part],
    guides: (part, s) => guidesForPart(part, s.setup.cooling),
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
  });
}
