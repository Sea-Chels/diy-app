import { PARTS } from '../data/parts';
import { guidesForPart, type Guide } from '../data/guides';
import { getState, setState, subscribe } from '../store';
import { h, clear } from '../../shared/dom';
import { icon } from '../../shared/icons';
import { guideCard } from './guideCard';

export function mountPanel(root: HTMLElement): void {
  function render(): void {
    const { selectedPart, openGuide, vehicle } = getState();
    clear(root);
    root.classList.toggle('open', Boolean(selectedPart));
    if (!selectedPart) return;

    const info = PARTS[selectedPart];
    const primary = guidesForPart(selectedPart, vehicle.powertrain);
    const seen = new Set(primary.map((g) => g.id));
    const nearby: Guide[] = [];
    for (const rel of info.related ?? []) {
      for (const g of guidesForPart(rel, vehicle.powertrain)) {
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

    const list = h('div', { class: 'repair-list' });
    if (!primary.length && !nearby.length) {
      list.append(h('p', { class: 'muted' }, `Nothing here is a sensible DIY job on a ${vehicle.powertrain === 'ev' ? 'electric car' : 'car like this'}. Leave it to a shop.`));
    }
    for (const g of primary) list.append(guideCard(g, g.id === openGuide));
    if (nearby.length) {
      list.append(h('h3', { class: 'section-label' }, 'Nearby'));
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
    if (s.selectedPart !== prev.selectedPart || s.openGuide !== prev.openGuide || s.vehicle !== prev.vehicle) render();
  });
  render();
}
