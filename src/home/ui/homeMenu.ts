import { CEILING_LABEL, COUNTER_LABEL, FLOOR_LABEL, WALL_HEX, WALL_LABEL, type Setup, type WallColor } from '../data/setup';
import { getState, setSetup, setState, subscribe } from '../store';
import { h } from '../../shared/dom';
import { sceneMenu } from '../../shared/ui/sceneMenu';
import type { AreaId } from '../data/areas';

/** Floating "Your home" menu: countertop, ceiling fixture, flooring and wall colour. */
export function mountHomeMenu(root: HTMLElement): void {
  const { toggle, card } = sceneMenu(root, { id: 'home-card', icon: 'sliders', label: 'Your home', title: 'Home setup' });

  type SegKey = 'counter' | 'ceiling' | 'floor';
  const segs = new Map<SegKey, Map<string, HTMLButtonElement>>();
  function seg<K extends SegKey>(key: K, labels: Record<Setup[K], string>, show: AreaId): HTMLElement {
    const row = h('div', { class: 'seg' });
    const btns = new Map<string, HTMLButtonElement>();
    for (const v of Object.keys(labels) as Setup[K][]) {
      const b = h('button', { onClick: () => { setSetup({ [key]: v } as Partial<Setup>); setState({ selectedArea: show, openGuide: null }); } }, labels[v]);
      btns.set(v, b);
      row.append(b);
    }
    segs.set(key, btns);
    return row;
  }
  const swatches = h('div', { class: 'swatches home-swatches' });
  const swatchBtns = new Map<WallColor, HTMLButtonElement>();
  for (const c of Object.keys(WALL_LABEL) as WallColor[]) {
    const b = h('button', { class: 'swatch', title: WALL_LABEL[c], 'aria-label': `${WALL_LABEL[c]} walls`, onClick: () => setSetup({ wall: c }) });
    b.style.background = `#${WALL_HEX[c].toString(16).padStart(6, '0')}`;
    swatchBtns.set(c, b);
    swatches.append(b);
  }

  card.append(
    h('p', { class: 'paint-label' }, 'Countertop'), seg('counter', COUNTER_LABEL, 'counters'),
    h('p', { class: 'paint-label' }, 'Ceiling'), seg('ceiling', CEILING_LABEL, 'lights'),
    h('p', { class: 'paint-label' }, 'Floor'), seg('floor', FLOOR_LABEL, 'floor'),
    h('p', { class: 'paint-label' }, 'Wall colour'), swatches,
  );

  function sync(): void {
    const s = getState().setup;
    (['counter', 'ceiling', 'floor'] as SegKey[]).forEach((k) => segs.get(k)!.forEach((b, v) => b.classList.toggle('active', s[k] === v)));
    swatchBtns.forEach((b, c) => b.classList.toggle('active', s.wall === c));
    toggle.style.setProperty('--c', `#${WALL_HEX[s.wall].toString(16).padStart(6, '0')}`);
  }

  subscribe((s, prev) => {
    if (s.setup !== prev.setup) sync();
  });
  sync();
}
