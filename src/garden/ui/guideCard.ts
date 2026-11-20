import { KIND_LABEL, type Guide } from '../data/guides';
import { PLANT_BY_ID, plantName } from '../data/plants';
import { setState } from '../store';
import { h } from '../../shared/dom';
import { icon } from '../../shared/icons';
import * as card from '../../shared/ui/guideCard';
import { openPlantGuide } from './plantGuide';

export const guideChips = (g: Guide) => card.guideChips(g, KIND_LABEL[g.kind]);

export function guideCard(g: Guide, open: boolean): HTMLElement {
  return card.guideCard(g, {
    open,
    chips: guideChips(g),
    onToggle: () => setState({ openGuide: open ? null : g.id }),
    body: () => {
      const plants = (g.plants ?? []).filter((id) => PLANT_BY_ID.has(id));
      return [
        card.summary(g),
        g.wait && card.note('wait', 'sprout', g.wait),
        card.savings(g),
        card.videoButton(g.query),
        card.cautions(g),
        card.linkChips(g),
        card.toolsAndSupplies(g),
        ...card.steps(g),
        ...(plants.length
          ? [h('h4', {}, 'Plant care cards'), h('div', { class: 'plant-chips' }, ...plants.map((id) =>
              h('button', { class: 'link-chip', onClick: () => openPlantGuide(id) }, icon('sprout', 13), plantName(id))))]
          : []),
      ];
    },
  });
}
