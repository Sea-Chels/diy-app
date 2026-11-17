import { FILL_LABEL, HYDRO_LABEL, SEASON_LABEL, type Setup } from '../data/setup';
import { getState, setSetup, setState, subscribe } from '../store';
import { h } from '../../shared/dom';
import { icon } from '../../shared/icons';

/** Floating "Your garden" menu: season, how the cutaway bed is filled, and the hydro system. */
export function mountGardenMenu(root: HTMLElement): void {
  const toggle = h('button', { class: 'paint-toggle', 'aria-expanded': 'false', 'aria-controls': 'garden-card' }, icon('sliders', 16), h('span', {}, 'Your garden'), h('span', { class: 'paint-dot' }));
  const card = h('div', { class: 'paint-card', id: 'garden-card', role: 'dialog', 'aria-label': 'Garden setup' });

  type SegKey = keyof Setup;
  const segs = new Map<SegKey, Map<string, HTMLButtonElement>>();
  function seg<K extends SegKey>(key: K, labels: Record<Setup[K], string>, then?: () => void): HTMLElement {
    const row = h('div', { class: 'seg' });
    const btns = new Map<string, HTMLButtonElement>();
    for (const v of Object.keys(labels) as Setup[K][]) {
      const b = h('button', { onClick: () => { setSetup({ [key]: v } as Partial<Setup>); then?.(); } }, labels[v]);
      btns.set(v, b);
      row.append(b);
    }
    segs.set(key, btns);
    return row;
  }

  card.append(
    h('p', { class: 'paint-label' }, 'Season'), seg('season', SEASON_LABEL),
    h('p', { class: 'paint-label' }, 'Raised bed fill'), seg('fill', FILL_LABEL, () => setState({ selectedArea: 'bed', openGuide: null })),
    h('p', { class: 'paint-label' }, 'Hydroponics'), seg('hydro', HYDRO_LABEL, () => setState({ selectedArea: 'hydro', openGuide: null })),
  );
  root.append(toggle, card);

  const DOT: Record<Setup['season'], string> = { spring: '#a3e635', summer: '#4ade80', fall: '#f59e0b' };
  function sync(): void {
    const s = getState().setup;
    (Object.keys(s) as SegKey[]).forEach((k) => segs.get(k)!.forEach((b, v) => b.classList.toggle('active', s[k] === v)));
    toggle.style.setProperty('--c', DOT[s.season]);
  }

  function setOpen(open: boolean): void {
    root.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setOpen(!root.classList.contains('open')));
  document.addEventListener('pointerdown', (e) => {
    if (!root.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  subscribe((s, prev) => {
    if (s.setup !== prev.setup) sync();
  });
  sync();
}
