import { PARTS, PART_ORDER } from '../data/parts';
import { DIFFICULTY_LABEL, GUIDES, appliesTo, type Guide } from '../data/guides';
import type { Difficulty } from '../../shared/guides';
import { getState, select } from '../store';
import { openGuideIndex as open } from '../../shared/ui/guideIndex';
import { guideChips } from './guideCard';

export function openGuideIndex(): void {
  const pt = getState().vehicle.powertrain;
  open({
    guides: GUIDES,
    title: 'Everything you can fix',
    filters: [
      { label: 'All levels', keep: () => true },
      ...([1, 2, 3] as Difficulty[]).map((d) => ({ label: DIFFICULTY_LABEL[d], keep: (g: Guide) => g.difficulty === d })),
    ],
    toggle: { label: (on) => (on ? `${pt.toUpperCase()} only` : 'All powertrains'), keep: (g) => appliesTo(g, pt) },
    zones: PART_ORDER,
    zoneLabel: (p) => PARTS[p].label,
    zoneOf: (g) => g.parts[0],
    searchWords: (g) => g.parts.map((p) => PARTS[p].label),
    chips: guideChips,
    onPick: (g) => select(g.parts[0], g.id),
    placeholder: 'Search fixes: oil, fuse, flat tire, chain…',
    empty: 'No fixes match. Try a broader word, or switch on all powertrains.',
    sub: `${GUIDES.length} jobs for the car, motorcycle and bike, all doable in a driveway.`,
  });
}
