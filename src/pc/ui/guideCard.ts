import { KIND_LABEL, type Guide } from '../data/guides';
import { CATEGORY_LABEL } from '../data/catalog';
import { getState, setState } from '../store';
import { h } from '../../shared/dom';
import { fmtMinutes } from '../../shared/format';
import * as card from '../../shared/ui/guideCard';
import { pickedName } from './context';

export const guideChips = (g: Guide) => card.guideChips(g, KIND_LABEL[g.kind], fmtMinutes);

export function guideCard(g: Guide, open: boolean): HTMLElement {
  return card.guideCard(g, {
    open,
    chips: guideChips(g),
    onToggle: () => setState({ openGuide: open ? null : g.id }),
    body: () => {
      const named = g.ctx ? pickedName(getState().build, g.ctx) : null;
      return [
        card.summary(g),
        g.savings && card.note('savings', 'savings', g.savings),
        card.videoButton(named ? `${named} ${g.query}` : g.query, named ? `Videos for the ${named}` : undefined),
        g.ctx && !named && h('p', { class: 'hint-text' }, `Pick your ${CATEGORY_LABEL[g.ctx].toLowerCase()} in the parts picker to get videos for your exact part.`),
        card.cautions(g),
        card.toolsAndSupplies(g, 'Parts & supplies'),
        ...card.steps(g),
      ];
    },
  });
}
