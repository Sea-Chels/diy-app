import { DIFFICULTY_LABEL, KIND_LABEL, type Guide } from '../data/guides';
import { TOOL_BY_ID } from '../data/tools';
import { getState, setState } from '../store';
import { h } from '../../shared/dom';
import { searchUrl } from '../../shared/youtube';
import { icon } from '../../shared/icons';
import { fmtTime } from './format';
import { openToolbox } from './toolbox';

/** The chips row shared by guide cards and index rows. */
export function guideChips(g: Guide): HTMLElement {
  return h('span', { class: 'chips' },
    h('span', { class: `chip kind kind-${g.kind}` }, KIND_LABEL[g.kind]),
    h('span', { class: 'chip diff' }, DIFFICULTY_LABEL[g.difficulty]),
    h('span', { class: 'chip' }, fmtTime(g.minutes)));
}

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

/** Expandable guide card for the side panel. */
export function guideCard(g: Guide, open: boolean): HTMLElement {
  const card = h('article', { class: `repair-card diff-${g.difficulty}${open ? ' open' : ''}`, 'data-guide': g.id });
  card.append(
    h('button', { class: 'repair-head', 'aria-expanded': String(open), onClick: () => setState({ openGuide: open ? null : g.id }) },
      h('span', { class: 'repair-title' }, g.title), guideChips(g)),
  );
  if (!open) return card;

  const body = h('div', { class: 'repair-body' });
  body.append(h('p', { class: 'summary' }, g.summary));
  if (g.savings) body.append(h('p', { class: 'savings' }, icon('savings', 16), h('span', {}, `Saves ${g.savings}.`)));
  body.append(
    h('a', { class: 'primary-btn', href: searchUrl(g.query), target: '_blank', rel: 'noopener noreferrer' },
      icon('play', 16), 'Watch how-to videos', icon('external', 15)),
  );
  if (g.cautions?.length) body.append(h('div', { class: 'cautions' }, ...g.cautions.map((c) => h('p', {}, icon('warning', 16), h('span', {}, c)))));
  if (g.pro) body.append(h('p', { class: 'pro' }, icon('alert', 16), h('span', {}, h('strong', {}, 'Call a pro: '), g.pro)));
  if (g.links?.length) {
    body.append(h('div', { class: 'panel-links' }, ...g.links.map((l) =>
      h('a', { class: 'link-chip', href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label, icon('external', 13)))));
  }

  const owned = new Set(getState().owned);
  const { have, of } = toolCount(g);
  const toolItems = g.tools.map((t) => {
    const tool = TOOL_BY_ID.get(t);
    if (!tool) return h('li', { class: 'tool-free' }, t);
    const has = owned.has(t);
    return h('li', {},
      h('button', { class: `tool-check${has ? ' has' : ''}`, 'aria-pressed': String(has), title: has ? 'In your toolbox' : 'Mark as owned', onClick: () => toggleOwned(t) },
        icon(has ? 'boxChecked' : 'box', 15), tool.name));
  });
  body.append(
    h('div', { class: 'two-col' },
      h('div', {},
        h('h4', {}, 'Tools ', of ? h('button', { class: 'have-count', onClick: openToolbox }, `you have ${have} of ${of}`) : null),
        h('ul', { class: 'tool-list' }, ...(toolItems.length ? toolItems : [h('li', { class: 'muted' }, 'None')]))),
      h('div', {}, h('h4', {}, 'Supplies'), h('ul', {}, ...(g.supplies.length ? g.supplies.map((t) => h('li', {}, t)) : [h('li', { class: 'muted' }, 'Nothing to buy')])))),
  );
  body.append(h('h4', {}, 'Steps'), h('ol', { class: 'steps' }, ...g.steps.map((s) => h('li', {}, s))));
  card.append(body);
  return card;
}
