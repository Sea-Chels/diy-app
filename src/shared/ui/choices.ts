import { h } from '../dom';

/** Marks a toggle button on or off, for screen readers as well as by look. */
export function press(b: HTMLElement, on: boolean): void {
  b.classList.toggle('active', on);
  b.setAttribute('aria-pressed', String(on));
}

/** A one-of-many button set; `sync` marks the current value. */
export interface Choices<V extends string> {
  el: HTMLElement;
  buttons: Map<V, HTMLButtonElement>;
  sync(current: V): void;
}

function choices<V extends string>(el: HTMLElement, entries: [V, HTMLButtonElement][]): Choices<V> {
  const buttons = new Map(entries);
  el.append(...buttons.values());
  return { el, buttons, sync: (current) => buttons.forEach((b, v) => press(b, v === current)) };
}

/** A segmented control with one button per key of `labels`. `name` labels the group. */
export function segControl<V extends string>(name: string, labels: Record<V, string>, onPick: (v: V) => void): Choices<V> {
  const el = h('div', { class: 'seg', role: 'group', 'aria-label': name });
  return choices(el, (Object.keys(labels) as V[]).map((v) => [v, h('button', { onClick: () => onPick(v) }, labels[v])]));
}

export interface Swatch<V extends string> {
  value: V;
  /** Any CSS colour. */
  color: string;
  name: string;
}

/** A row of round colour swatches. `name` labels the group. */
export function swatchRow<V extends string>(name: string, swatches: readonly Swatch<V>[], onPick: (v: V) => void): Choices<V> {
  const el = h('div', { class: 'swatches', role: 'group', 'aria-label': name });
  return choices(el, swatches.map((s) => {
    const b = h('button', { class: 'swatch', title: s.name, 'aria-label': s.name, onClick: () => onPick(s.value) });
    b.style.setProperty('--c', s.color);
    return [s.value, b];
  }));
}

/** A filter chip; rows of these are rebuilt on each render, so the state goes in at creation. */
export const chip = (label: string, active: boolean, onClick: () => void) =>
  h('button', { class: `chip-btn${active ? ' active' : ''}`, 'aria-pressed': String(active), onClick }, label);
