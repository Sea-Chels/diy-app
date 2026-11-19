import { guessBody } from '../data/makes';
import { BODY_LABEL, FINISHES, SWATCHES, type Finish } from '../data/paint';
import { getState, setState, subscribe, type Appearance } from '../store';
import { h } from '../../shared/dom';
import { segControl, swatchRow } from '../../shared/ui/choices';
import { sceneMenu } from '../../shared/ui/sceneMenu';

const FINISH_LABEL = Object.fromEntries(Object.entries(FINISHES).map(([f, v]) => [f, v.label])) as Record<Finish, string>;

/** Floating "Paint" menu: body style, color and finish. Built once, then kept in sync. */
export function mountPaintShop(root: HTMLElement): void {
  const { toggle, card } = sceneMenu(root, { id: 'menu-card', icon: 'palette', label: 'Paint', title: 'Paint and body style' });

  const setAppearance = (patch: Partial<Appearance>) => setState({ appearance: { ...getState().appearance, ...patch } });

  const body = segControl('Body', BODY_LABEL, (b) => setAppearance({ body: b }));
  const color = swatchRow('Color', SWATCHES.map((s) => ({ value: s.hex, color: s.hex, name: s.name })), (c) => setAppearance({ color: c }));
  const custom = h('input', { type: 'color', 'aria-label': 'Custom color' });
  custom.addEventListener('input', () => setAppearance({ color: custom.value }));
  const customWrap = h('label', { class: 'swatch custom', title: 'Custom color' }, custom);
  color.el.append(customWrap);
  const finish = segControl('Finish', FINISH_LABEL, (f) => setAppearance({ finish: f }));

  card.append(
    h('p', { class: 'group-label' }, 'Body'), body.el,
    h('p', { class: 'group-label' }, 'Color'), color.el,
    h('p', { class: 'group-label' }, 'Finish'), finish.el,
  );

  function sync(): void {
    const { appearance: a, vehicle: v } = getState();
    body.buttons.get('auto')!.textContent = `${BODY_LABEL.auto} · ${BODY_LABEL[guessBody(v.make, v.model)]}`;
    body.sync(a.body);
    // Swatch hexes are lowercase; a stored color may not be.
    const current = a.color.toLowerCase();
    color.sync(current);
    customWrap.classList.toggle('active', !color.buttons.has(current));
    customWrap.style.setProperty('--c', a.color);
    if (document.activeElement !== custom) custom.value = a.color;
    finish.sync(a.finish);
    toggle.style.setProperty('--c', a.color);
  }

  subscribe((s, prev) => {
    if (s.appearance !== prev.appearance || s.vehicle !== prev.vehicle) sync();
  });
  sync();
}
