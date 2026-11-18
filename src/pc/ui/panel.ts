import { PARTS } from '../data/parts';
import { guidesForPart, type Guide } from '../data/guides';
import { CATEGORY_PLURAL, PPP_CATEGORY } from '../data/catalog';
import { getState, setState, subscribe } from '../store';
import { h, clear } from '../../shared/dom';
import { icon } from '../../shared/icons';
import { PART_CATEGORY } from './context';
import { guideCard } from './guideCard';
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

  subscribe((s, prev) => {
    if (s.selectedPart !== prev.selectedPart || s.openGuide !== prev.openGuide || s.build !== prev.build || s.setup.cooling !== prev.setup.cooling) render();
  });
  render();
}
