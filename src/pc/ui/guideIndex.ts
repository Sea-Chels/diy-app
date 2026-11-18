import { PARTS, PART_ORDER } from '../data/parts';
import { GUIDES, KIND_LABEL, appliesTo } from '../data/guides';
import { getState, setState } from '../store';
import { kindFilters, openGuideIndex as open } from '../../shared/ui/guideIndex';
import { guideChips } from './guideCard';

export function openGuideIndex(): void {
  const guides = GUIDES.filter((g) => appliesTo(g, getState().setup.cooling));
  open({
    guides,
    filters: kindFilters(KIND_LABEL),
    zones: PART_ORDER,
    zoneLabel: (p) => PARTS[p].label,
    zoneOf: (g) => g.parts[0],
    searchWords: (g) => g.parts.map((p) => PARTS[p].label),
    chips: guideChips,
    onPick: (g) => setState({ selectedPart: g.parts[0], openGuide: g.id }),
    placeholder: 'Search: no post, bios, xmp, thermal paste, install windows…',
    empty: 'No guides match. Try a broader word.',
    sub: `${guides.length} guides: troubleshooting, replacing parts, BIOS and OS setup.`,
  });
}
