import { PARTS } from '../data/parts';
import { DIFFICULTY_LABEL, KIND_LABEL, guidesForPart, type Guide } from '../data/guides';
import { CATEGORY_LABEL, CATEGORY_PLURAL, PPP_CATEGORY } from '../data/catalog';
import { getState, setState, subscribe } from '../store';
import { h, clear, fmtMinutes } from '../../shared/dom';
import { searchUrl } from '../../shared/youtube';
import { icon } from '../../shared/icons';
import { PART_CATEGORY, pickedName } from './context';
import { openBuilder } from './builder';

export function mountPanel(root: HTMLElement): void {
  function render(): void {
    const { selectedPart, openGuide, setup } = getState();
    clear(root);
    root.classList.toggle('open', Boolean(selectedPart));
    if (!selectedPart) return;

    const info = PARTS[selectedPart];
    const primary = guidesForPart(selectedPart, setup.cooling);
    const seen = new Set(primary.map((g) => g.id));
    const nearby: Guide[] = [];
    for (const rel of info.related ?? []) {
      for (const g of guidesForPart(rel, setup.cooling)) {
        if (!seen.has(g.id)) {
          seen.add(g.id);
          nearby.push(g);
        }
      }
    }

    root.append(
      h('header', { class: 'panel-head' },
        h('div', {}, h('h2', {}, info.label), h('p', { class: 'muted' }, info.blurb)),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: () => setState({ selectedPart: null, openGuide: null }) }, icon('close'))),
    );

    const cat = PART_CATEGORY[selectedPart];
    if (cat) {
      root.append(
        h('div', { class: 'panel-links' },
          h('a', { class: 'link-chip', href: `https://pcpartpicker.com/products/${PPP_CATEGORY[cat]}/`, target: '_blank', rel: 'noopener noreferrer' }, `Compare ${CATEGORY_PLURAL[cat]} on PCPartPicker`, icon('external', 13)),
          h('button', { class: 'link-chip', onClick: () => openBuilder(cat) }, icon('list', 14), 'Check fit in the parts picker')),
      );
    }

    const list = h('div', { class: 'repair-list' });
    for (const g of primary) list.append(guideCard(g, g.id === openGuide));
    if (nearby.length) {
      list.append(h('h3', { class: 'section-label' }, 'Related'));
      for (const g of nearby) list.append(guideCard(g, g.id === openGuide));
    }
    root.append(list);

    if (openGuide) {
      requestAnimationFrame(() => {
        const card = root.querySelector<HTMLElement>('.repair-card.open');
        if (card) root.scrollTo({ top: Math.max(0, card.offsetTop - 120), behavior: 'smooth' });
      });
    }
  }

  function guideCard(g: Guide, open: boolean): HTMLElement {
    const card = h('article', { class: `repair-card diff-${g.difficulty}${open ? ' open' : ''}` });
    card.append(
      h('button', { class: 'repair-head', 'aria-expanded': String(open), onClick: () => setState({ openGuide: open ? null : g.id }) },
        h('span', { class: 'repair-title' }, g.title),
        h('span', { class: 'chips' },
          h('span', { class: `chip kind kind-${g.kind}` }, KIND_LABEL[g.kind]),
          h('span', { class: 'chip diff' }, DIFFICULTY_LABEL[g.difficulty]),
          h('span', { class: 'chip' }, fmtMinutes(g.minutes)))),
    );
    if (!open) return card;

    const body = h('div', { class: 'repair-body' });
    body.append(h('p', { class: 'summary' }, g.summary));
    if (g.savings) body.append(h('p', { class: 'savings' }, icon('savings', 16), h('span', {}, g.savings)));

    const named = g.ctx ? pickedName(getState().build, g.ctx) : null;
    body.append(
      h('a', { class: 'primary-btn', href: searchUrl(named ? `${named} ${g.query}` : g.query), target: '_blank', rel: 'noopener noreferrer' },
        icon('play', 16), named ? `Videos for the ${named}` : 'Watch how-to videos', icon('external', 15)),
    );
    if (g.ctx && !named) body.append(h('p', { class: 'hint-text' }, `Pick your ${CATEGORY_LABEL[g.ctx].toLowerCase()} in the parts picker to get videos for your exact part.`));

    if (g.cautions?.length) body.append(h('div', { class: 'cautions' }, ...g.cautions.map((c) => h('p', {}, icon('warning', 16), h('span', {}, c)))));
    if (g.tools.length || g.supplies.length) {
      body.append(
        h('div', { class: 'two-col' },
          h('div', {}, h('h4', {}, 'Tools'), h('ul', {}, ...(g.tools.length ? g.tools.map((t) => h('li', {}, t)) : [h('li', { class: 'muted' }, 'None')]))),
          h('div', {}, h('h4', {}, 'Parts & supplies'), h('ul', {}, ...(g.supplies.length ? g.supplies.map((t) => h('li', {}, t)) : [h('li', { class: 'muted' }, 'Nothing to buy')])))),
      );
    }
    body.append(h('h4', {}, 'Steps'), h('ol', { class: 'steps' }, ...g.steps.map((s) => h('li', {}, s))));
    card.append(body);
    return card;
  }

  subscribe((s, prev) => {
    if (s.selectedPart !== prev.selectedPart || s.openGuide !== prev.openGuide || s.build !== prev.build || s.setup.cooling !== prev.setup.cooling) render();
  });
  render();
}
