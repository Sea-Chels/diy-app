import { PARTS } from '../data/parts';
import { guidesForPart } from '../data/guides';
import { select, store } from '../store';
import { mountGuidePanel } from '../../shared/ui/guidePanel';
import { guideCard } from './guideCard';

export function mountPanel(root: HTMLElement): void {
  mountGuidePanel(root, {
    store,
    select,
    info: (part) => PARTS[part],
    guides: (part, s) => guidesForPart(part, s.vehicle.powertrain),
    card: guideCard,
    relatedLabel: 'Nearby',
    empty: (s) => `Nothing here is a sensible DIY job on a ${s.vehicle.powertrain === 'ev' ? 'electric car' : 'car like this'}. Leave it to a shop.`,
    // The vehicle names each guide's video search.
    refresh: (s, prev) => s.vehicle !== prev.vehicle,
  });
}
