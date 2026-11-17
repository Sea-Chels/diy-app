import { DIFFICULTY_LABEL, KIND_LABEL, type Guide } from '../data/guides';
import { PLANT_BY_ID } from '../data/plants';
import { setState } from '../store';
import { h } from '../../shared/dom';
import { searchUrl } from '../../shared/youtube';
import { icon } from '../../shared/icons';
import { fmtTime } from './format';
import { openPlantGuide } from './plantGuide';

/** The chips row shared by guide cards and index rows. */
export function guideChips(g: Guide): HTMLElement {
  return h('span', { class: 'chips' },
    h('span', { class: `chip kind kind-${g.kind}` }, KIND_LABEL[g.kind]),
    h('span', { class: 'chip diff' }, DIFFICULTY_LABEL[g.difficulty]),
    h('span', { class: 'chip' }, fmtTime(g.minutes)));
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
  if (g.wait) body.append(h('p', { class: 'wait' }, icon('sprout', 16), h('span', {}, g.wait)));
  if (g.savings) body.append(h('p', { class: 'savings' }, icon('savings', 16), h('span', {}, g.savings)));
  body.append(
    h('a', { class: 'primary-btn', href: searchUrl(g.query), target: '_blank', rel: 'noopener noreferrer' },
      icon('play', 16), 'Watch how-to videos', icon('external', 15)),
  );
  if (g.cautions?.length) body.append(h('div', { class: 'cautions' }, ...g.cautions.map((c) => h('p', {}, icon('warning', 16), h('span', {}, c)))));
  if (g.links?.length) {
    body.append(h('div', { class: 'panel-links' }, ...g.links.map((l) =>
      h('a', { class: 'link-chip', href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label, icon('external', 13)))));
  }
  if (g.tools.length || g.supplies.length) {
    body.append(
      h('div', { class: 'two-col' },
        h('div', {}, h('h4', {}, 'Tools'), h('ul', {}, ...(g.tools.length ? g.tools.map((t) => h('li', {}, t)) : [h('li', { class: 'muted' }, 'None')]))),
        h('div', {}, h('h4', {}, 'Supplies'), h('ul', {}, ...(g.supplies.length ? g.supplies.map((t) => h('li', {}, t)) : [h('li', { class: 'muted' }, 'Nothing to buy')])))),
    );
  }
  body.append(h('h4', {}, 'Steps'), h('ol', { class: 'steps' }, ...g.steps.map((s) => h('li', {}, s))));
  const plants = (g.plants ?? []).filter((id) => PLANT_BY_ID.has(id));
  if (plants.length) {
    body.append(h('h4', {}, 'Plant care cards'), h('div', { class: 'plant-chips' }, ...plants.map((id) =>
      h('button', { class: 'link-chip', onClick: () => openPlantGuide(id) }, icon('sprout', 13), PLANT_BY_ID.get(id)!.name))));
  }
  card.append(body);
  return card;
}
