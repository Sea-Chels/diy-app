import { AREAS, AREA_ORDER } from '../data/areas';
import { GUIDES, KIND_LABEL } from '../data/guides';
import { select } from '../store';
import { kindFilters, openGuideIndex as open } from '../../shared/ui/guideIndex';
import { guideChips } from './guideCard';

export function openGuideIndex(): void {
  open({
    guides: GUIDES,
    filters: kindFilters(KIND_LABEL),
    zones: AREA_ORDER,
    zoneLabel: (a) => AREAS[a].label,
    zoneOf: (g) => g.spots[0],
    searchWords: (g) => [...g.spots.map((a) => AREAS[a].label), ...(g.plants ?? [])],
    chips: guideChips,
    onPick: (g) => select(g.spots[0], g.id),
    placeholder: 'Search: compost, hugelkultur, canning, aphids, pH…',
    empty: 'No guides match. Try a broader word, or look the plant up in the plant guide.',
    sub: `${GUIDES.length} guides: building beds, growing, fixing problems and preserving the harvest.`,
  });
}
