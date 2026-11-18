import { CEILING_LABEL, COUNTER_LABEL, FLOOR_LABEL, WALL_HEX, WALL_LABEL, type WallColor } from '../data/setup';
import { getState, select, setSetup, subscribe } from '../store';
import { h } from '../../shared/dom';
import { cssHex } from '../../shared/theme';
import { segControl, swatchRow } from '../../shared/ui/choices';
import { sceneMenu } from '../../shared/ui/sceneMenu';

/** Floating "Your home" menu: countertop, ceiling fixture, flooring and wall color. */
export function mountHomeMenu(root: HTMLElement): void {
  const { toggle, card } = sceneMenu(root, { id: 'home-card', icon: 'sliders', label: 'Your home', title: 'Home setup' });

  const counter = segControl('Countertop', COUNTER_LABEL, (v) => { setSetup({ counter: v }); select('counters'); });
  const ceiling = segControl('Ceiling', CEILING_LABEL, (v) => { setSetup({ ceiling: v }); select('lights'); });
  const floor = segControl('Floor', FLOOR_LABEL, (v) => { setSetup({ floor: v }); select('floor'); });
  const wall = swatchRow('Wall color', (Object.keys(WALL_LABEL) as WallColor[]).map((c) => ({ value: c, color: cssHex(WALL_HEX[c]), name: `${WALL_LABEL[c]} walls` })), (c) => setSetup({ wall: c }));
  wall.el.classList.add('home-swatches');

  card.append(
    h('p', { class: 'paint-label' }, 'Countertop'), counter.el,
    h('p', { class: 'paint-label' }, 'Ceiling'), ceiling.el,
    h('p', { class: 'paint-label' }, 'Floor'), floor.el,
    h('p', { class: 'paint-label' }, 'Wall color'), wall.el,
  );

  function sync(): void {
    const s = getState().setup;
    counter.sync(s.counter);
    ceiling.sync(s.ceiling);
    floor.sync(s.floor);
    wall.sync(s.wall);
    toggle.style.setProperty('--c', cssHex(WALL_HEX[s.wall]));
  }

  subscribe((s, prev) => {
    if (s.setup !== prev.setup) sync();
  });
  sync();
}
