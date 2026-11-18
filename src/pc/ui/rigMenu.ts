import { CASE_SWATCHES, COOLING_LABEL, GPU_LABEL, RGB_LABEL, RGB_SWATCHES, SIZE_LABEL, type Setup } from '../data/setup';
import { getState, setSetup, subscribe } from '../store';
import { h } from '../../shared/dom';
import { sceneMenu } from '../../shared/ui/sceneMenu';

/** Floating "Rig" menu: case size, cooling, GPU, RGB and colours. Built once, then kept in sync. */
export function mountRigMenu(root: HTMLElement): void {
  const { toggle, card } = sceneMenu(root, { id: 'rig-card', icon: 'sliders', label: 'Your rig', title: 'Rig setup' });

  type SegKey = 'size' | 'cooling' | 'gpu' | 'rgb';
  const segs = new Map<SegKey, Map<string, HTMLButtonElement>>();
  function seg<K extends SegKey>(key: K, labels: Record<Setup[K], string>): HTMLElement {
    const row = h('div', { class: 'seg' });
    const btns = new Map<string, HTMLButtonElement>();
    for (const v of Object.keys(labels) as Setup[K][]) {
      const b = h('button', { onClick: () => setSetup({ [key]: v } as Partial<Setup>) }, labels[v]);
      btns.set(v, b);
      row.append(b);
    }
    segs.set(key, btns);
    return row;
  }

  function swatchRow(list: { hex: string; name: string }[], key: 'rgbColor' | 'caseColor'): { el: HTMLElement; btns: HTMLButtonElement[] } {
    const el = h('div', { class: 'swatches' });
    const btns = list.map((s) => {
      const b = h('button', { class: 'swatch', title: s.name, 'aria-label': s.name, onClick: () => setSetup({ [key]: s.hex }) });
      b.style.setProperty('--c', s.hex);
      b.dataset.hex = s.hex;
      el.append(b);
      return b;
    });
    return { el, btns };
  }

  const rgbSw = swatchRow(RGB_SWATCHES.map((hex) => ({ hex, name: hex })), 'rgbColor');
  const caseSw = swatchRow(CASE_SWATCHES, 'caseColor');
  const rgbLabel = h('p', { class: 'paint-label' }, 'Lighting');
  const loopNote = h('p', { class: 'fine-print' }, 'Custom loops need room for a reservoir, so Mini-ITX uses an AIO.');

  card.append(
    h('p', { class: 'paint-label' }, 'Case'), seg('size', SIZE_LABEL),
    h('p', { class: 'paint-label' }, 'Cooling'), seg('cooling', COOLING_LABEL), loopNote,
    h('p', { class: 'paint-label' }, 'Graphics card'), seg('gpu', GPU_LABEL),
    rgbLabel, seg('rgb', RGB_LABEL), rgbSw.el,
    h('p', { class: 'paint-label' }, 'Case colour'), caseSw.el,
  );

  function sync(): void {
    const s = getState().setup;
    (['size', 'cooling', 'gpu', 'rgb'] as SegKey[]).forEach((k) => segs.get(k)!.forEach((b, v) => b.classList.toggle('active', s[k] === v)));
    segs.get('cooling')!.get('loop')!.disabled = s.size === 'itx';
    loopNote.hidden = s.size !== 'itx';
    rgbLabel.textContent = s.cooling === 'loop' ? 'Lighting & coolant' : 'Lighting';
    rgbSw.el.classList.toggle('dim', s.rgb === 'off' && s.cooling !== 'loop');
    rgbSw.btns.forEach((b) => b.classList.toggle('active', b.dataset.hex === s.rgbColor));
    caseSw.btns.forEach((b) => b.classList.toggle('active', b.dataset.hex === s.caseColor));
    toggle.style.setProperty('--c', s.rgb === 'off' ? s.caseColor : s.rgbColor);
  }

  subscribe((s, prev) => {
    if (s.setup !== prev.setup) sync();
  });
  sync();
}
