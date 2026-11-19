import { h, clear } from '../../shared/dom';
import { keepFocus } from '../../shared/focus';
import { openModal } from '../../shared/modal';
import { chip } from '../../shared/ui/choices';

export type CalcTab = 'paint' | 'floor' | 'wire';
const TAB_LABEL: Record<CalcTab, string> = { paint: 'Paint', floor: 'Flooring', wire: 'Wire & breakers' };

function num(label: string, value: number, step = 1, onInput: () => void): { el: HTMLElement; get: () => number } {
  const input = h('input', { type: 'number', min: '0', step: String(step), value: String(value), inputmode: 'decimal' });
  input.addEventListener('input', onInput);
  return { el: h('label', { class: 'calc-field' }, h('span', {}, label), input), get: () => Math.max(0, Number(input.value) || 0) };
}

function result(...lines: (string | HTMLElement)[]): HTMLElement {
  return h('div', { class: 'calc-result' }, ...lines.map((l) => (typeof l === 'string' ? h('p', {}, l) : l)));
}

/** Paint for a room: walls (and optionally the ceiling) at about 350 sq ft per gallon per coat. */
function paintCalc(): HTMLElement {
  const out = h('div', {});
  const update = () => {
    const walls = 2 * (L.get() + W.get()) * H.get() - doors.get() * 20 - windows.get() * 15;
    const area = Math.max(0, walls) + (ceil.checked ? L.get() * W.get() : 0);
    const gal = (area * coats.get()) / 350;
    const quarts = Math.ceil(gal * 4);
    clear(out);
    out.append(result(
      h('p', { class: 'big' }, `${gal.toFixed(1)} gal`),
      `${Math.round(area)} sq ft to paint × ${coats.get()} coat${coats.get() === 1 ? '' : 's'}.`,
      `Buy ${Math.floor(quarts / 4)} gallon${Math.floor(quarts / 4) === 1 ? '' : 's'}${quarts % 4 ? ` and ${quarts % 4} quart${quarts % 4 === 1 ? '' : 's'}` : ''}. Textured walls and dark-to-light changes take more.`,
    ));
  };
  const L = num('Room length (ft)', 12, 0.5, update);
  const W = num('Room width (ft)', 10, 0.5, update);
  const H = num('Wall height (ft)', 8, 0.5, update);
  const doors = num('Doors', 1, 1, update);
  const windows = num('Windows', 2, 1, update);
  const coats = num('Coats', 2, 1, update);
  const ceil = h('input', { type: 'checkbox' });
  ceil.addEventListener('change', update);
  update();
  return h('div', { class: 'calc' },
    h('div', { class: 'calc-grid' }, L.el, W.el, H.el, doors.el, windows.el, coats.el, h('label', { class: 'calc-check' }, ceil, 'Include the ceiling')),
    out, h('p', { class: 'fine-print' }, 'Assumes about 350 sq ft per gallon per coat and takes 20 sq ft off per door and 15 per window. Check the coverage on your can.'));
}

/** Flooring: area plus waste, rounded up to whole boxes. */
function floorCalc(): HTMLElement {
  const out = h('div', {});
  const update = () => {
    const area = L.get() * W.get();
    const withWaste = area * (1 + waste.get() / 100);
    const boxes = box.get() ? Math.ceil(withWaste / box.get()) : 0;
    clear(out);
    out.append(result(
      h('p', { class: 'big' }, `${boxes} box${boxes === 1 ? '' : 'es'}`),
      `${area.toFixed(0)} sq ft of floor, ${withWaste.toFixed(0)} sq ft with ${waste.get()}% waste.`,
      'Keep a spare box: a matching batch is hard to find later.',
    ));
  };
  const L = num('Room length (ft)', 12, 0.5, update);
  const W = num('Room width (ft)', 10, 0.5, update);
  const waste = num('Waste % (10 straight, 15 diagonal)', 10, 1, update);
  const box = num('Sq ft per box', 20, 0.1, update);
  update();
  return h('div', { class: 'calc' }, h('div', { class: 'calc-grid' }, L.el, W.el, waste.el, box.el), out,
    h('p', { class: 'fine-print' }, 'For L-shaped rooms, split them into rectangles and add the boxes.'));
}

/** The common copper sizes for household circuits. */
function wireChart(): HTMLElement {
  const rows: [string, string, string][] = [
    ['15 A', '14 AWG', 'Lighting and general outlets'],
    ['20 A', '12 AWG', 'Kitchen and bathroom outlets, dishwashers, disposals'],
    ['30 A', '10 AWG', 'Electric dryers, some water heaters'],
    ['40 A', '8 AWG', 'Cooktops and smaller electric ranges'],
    ['50 A', '6 AWG', 'Electric ranges'],
  ];
  return h('div', { class: 'calc' },
    h('table', { class: 'wire-table' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Breaker'), h('th', {}, 'Copper wire'), h('th', {}, 'Typical use'))),
      h('tbody', {}, ...rows.map(([a, w, u]) => h('tr', {}, h('td', {}, a), h('td', {}, w), h('td', {}, u))))),
    h('p', { class: 'fine-print' }, 'Wire gauge must match or be heavier than the breaker calls for: never put a bigger breaker on thinner wire. Smaller AWG numbers are thicker wire. The 8 and 6 AWG sizes are for NM (Romex) cable, which is rated at 60 °C. 15 A outlets are allowed on a 20 A circuit with more than one outlet; a 20 A outlet never goes on a 15 A circuit. Aluminum wire, long runs and appliance circuits follow the nameplate and local code: check with an electrician.'));
}

export function openCalculators(start: CalcTab = 'paint'): void {
  const tabs = h('div', { class: 'filter-row' });
  const pane = h('div', {});
  const BUILD: Record<CalcTab, () => HTMLElement> = { paint: paintCalc, floor: floorCalc, wire: wireChart };
  const show = (t: CalcTab) => keepFocus(tabs, () => showNow(t));
  function showNow(t: CalcTab): void {
    clear(tabs);
    for (const k of Object.keys(TAB_LABEL) as CalcTab[]) tabs.append(chip(TAB_LABEL[k], k === t, () => show(k)));
    clear(pane);
    pane.append(BUILD[t]());
  }
  openModal({ title: 'Calculators', sub: 'Paint, flooring, and which wire goes with which breaker.', className: 'calc-modal', body: h('div', { class: 'modal-body' }, tabs, pane) });
  show(start);
}
