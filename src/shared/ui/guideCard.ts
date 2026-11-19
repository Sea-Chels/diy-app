import { DIFFICULTY_LABEL, type GuideBase } from '../guides';
import { fmtTime } from '../format';
import { h } from '../dom';
import { icon, type IconName } from '../icons';
import { searchUrl } from '../youtube';

type Child = Node | string | null | undefined | false;

export function guideChips(g: GuideBase & { kind: string }, kindLabel: string, time = fmtTime): HTMLElement {
  return h('span', { class: 'chips' },
    h('span', { class: `chip kind kind-${g.kind}` }, kindLabel),
    h('span', { class: 'chip diff' }, DIFFICULTY_LABEL[g.difficulty]),
    h('span', { class: 'chip' }, time(g.minutes)));
}

/** Expandable card for the side panel; `body` is only built while the card is open. */
export function guideCard(g: GuideBase, o: { open: boolean; chips: HTMLElement; onToggle: () => void; body: () => Child[] }): HTMLElement {
  const card = h('article', { class: `guide-card diff-${g.difficulty}${o.open ? ' open' : ''}`, 'data-guide': g.id });
  card.append(
    h('button', { class: 'guide-head', 'aria-expanded': String(o.open), onClick: o.onToggle },
      h('span', { class: 'guide-title' }, g.title), o.chips),
  );
  if (o.open) card.append(h('div', { class: 'guide-body' }, ...o.body()));
  return card;
}

export const summary = (g: GuideBase) => h('p', { class: 'summary' }, g.summary);

export const note = (cls: string, name: IconName, ...content: Child[]) => h('p', { class: cls }, icon(name, 16), h('span', {}, ...content));

/** Savings strings are lowercase phrases ("a shop charges $40", "free"), capitalised here. */
export const savings = (g: GuideBase) => (g.savings ? note('savings', 'savings', g.savings[0].toUpperCase() + g.savings.slice(1)) : null);

export const videoButton = (query: string, label = 'Watch how-to videos') =>
  h('a', { class: 'primary-btn', href: searchUrl(query), target: '_blank', rel: 'noopener noreferrer' }, icon('play', 16), label, icon('external', 15));

export const cautions = (g: GuideBase) =>
  g.cautions?.length ? h('div', { class: 'cautions' }, ...g.cautions.map((c) => h('p', {}, icon('warning', 16), h('span', {}, c)))) : null;

export const linkChips = (g: GuideBase) =>
  g.links?.length
    ? h('div', { class: 'panel-links' }, ...g.links.map((l) => h('a', { class: 'link-chip', href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label, icon('external', 13))))
    : null;

export function listColumn(heading: Child[], items: (string | HTMLElement)[], empty: string, listClass?: string): HTMLElement {
  const lis = items.length ? items.map((t) => (typeof t === 'string' ? h('li', {}, t) : t)) : [h('li', { class: 'muted' }, empty)];
  return h('div', {}, h('h4', {}, ...heading), h('ul', { class: listClass }, ...lis));
}

export const twoCol = (left: HTMLElement, right: HTMLElement) => h('div', { class: 'two-col' }, left, right);

/** Plain tools and supplies lists, or nothing when a guide needs neither. */
export const toolsAndSupplies = (g: GuideBase, suppliesTitle = 'Supplies') =>
  g.tools.length || g.supplies.length
    ? twoCol(listColumn(['Tools'], g.tools, 'None'), listColumn([suppliesTitle], g.supplies, 'Nothing to buy'))
    : null;

export const steps = (g: GuideBase) => [h('h4', {}, 'Steps'), h('ol', { class: 'steps' }, ...g.steps.map((s) => h('li', {}, s)))];
