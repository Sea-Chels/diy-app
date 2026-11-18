import { KIND_LABEL, type Guide } from '../data/guides';
import { TOOL_BY_ID } from '../data/tools';
import { getState, setState } from '../store';
import { h } from '../../shared/dom';
import { icon } from '../../shared/icons';
import * as card from '../../shared/ui/guideCard';
import { openToolbox } from './toolbox';

export const guideChips = (g: Guide) => card.guideChips(g, KIND_LABEL[g.kind]);

export function toggleOwned(id: string): void {
  const owned = new Set(getState().owned);
  if (owned.has(id)) owned.delete(id);
  else owned.add(id);
  setState({ owned: [...owned] });
}

/** Catalog tools in a guide, and how many of them you own. */
export function toolCount(g: Guide): { have: number; of: number } {
  const owned = new Set(getState().owned);
  const ids = g.tools.filter((t) => TOOL_BY_ID.has(t));
  return { have: ids.filter((t) => owned.has(t)).length, of: ids.length };
}

/** Tools from the catalog can be ticked off as owned; anything else is plain text. */
function toolsColumn(g: Guide): HTMLElement {
  const owned = new Set(getState().owned);
  const { have, of } = toolCount(g);
  const items = g.tools.map((t) => {
    const tool = TOOL_BY_ID.get(t);
    if (!tool) return h('li', { class: 'tool-free' }, t);
    const has = owned.has(t);
    return h('li', {},
      h('button', { class: `tool-check${has ? ' has' : ''}`, 'aria-pressed': String(has), title: has ? 'In your toolbox' : 'Mark as owned', onClick: () => toggleOwned(t) },
        icon(has ? 'boxChecked' : 'box', 15), tool.name));
  });
  return card.listColumn(['Tools ', of ? h('button', { class: 'have-count', onClick: openToolbox }, `you have ${have} of ${of}`) : null], items, 'None', 'tool-list');
}

export function guideCard(g: Guide, open: boolean): HTMLElement {
  return card.guideCard(g, {
    open,
    chips: guideChips(g),
    onToggle: () => setState({ openGuide: open ? null : g.id }),
    body: () => [
      card.summary(g),
      card.savings(g),
      card.videoButton(g.query),
      card.cautions(g),
      g.pro && card.note('pro', 'alert', h('strong', {}, 'Call a pro: '), g.pro),
      card.linkChips(g),
      card.twoCol(toolsColumn(g), card.listColumn(['Supplies'], g.supplies, 'Nothing to buy')),
      ...card.steps(g),
    ],
  });
}
