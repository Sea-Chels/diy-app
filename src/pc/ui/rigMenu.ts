import { CASE_SWATCHES, COOLING_LABEL, GPU_LABEL, RGB_LABEL, RGB_SWATCHES, SIZE_LABEL } from '../data/setup';
import { getState, setSetup, subscribe } from '../store';
import { h } from '../../shared/dom';
import { segControl, swatchRow } from '../../shared/ui/choices';
import { sceneMenu } from '../../shared/ui/sceneMenu';

const asSwatches = (list: { name: string; hex: string }[]) => list.map((s) => ({ value: s.hex, color: s.hex, name: s.name }));

/** Floating "Rig" menu: case size, cooling, GPU, RGB and colors. Built once, then kept in sync. */
export function mountRigMenu(root: HTMLElement): void {
  const { toggle, card } = sceneMenu(root, { id: 'rig-card', icon: 'sliders', label: 'Your rig', title: 'Rig setup' });

  const size = segControl('Case', SIZE_LABEL, (v) => setSetup({ size: v }));
  const cooling = segControl('Cooling', COOLING_LABEL, (v) => setSetup({ cooling: v }));
  const gpu = segControl('Graphics card', GPU_LABEL, (v) => setSetup({ gpu: v }));
  const rgb = segControl('Lighting', RGB_LABEL, (v) => setSetup({ rgb: v }));
  const rgbColor = swatchRow('Lighting color', asSwatches(RGB_SWATCHES), (c) => setSetup({ rgbColor: c }));
  const caseColor = swatchRow('Case color', asSwatches(CASE_SWATCHES), (c) => setSetup({ caseColor: c }));
  const rgbLabel = h('p', { class: 'paint-label' }, 'Lighting');
  const loopNote = h('p', { class: 'fine-print' }, 'Custom loops need room for a reservoir, so Mini-ITX uses an AIO.');

  card.append(
    h('p', { class: 'paint-label' }, 'Case'), size.el,
    h('p', { class: 'paint-label' }, 'Cooling'), cooling.el, loopNote,
    h('p', { class: 'paint-label' }, 'Graphics card'), gpu.el,
    rgbLabel, rgb.el, rgbColor.el,
    h('p', { class: 'paint-label' }, 'Case color'), caseColor.el,
  );

  function sync(): void {
    const s = getState().setup;
    size.sync(s.size);
    cooling.sync(s.cooling);
    gpu.sync(s.gpu);
    rgb.sync(s.rgb);
    rgbColor.sync(s.rgbColor);
    caseColor.sync(s.caseColor);
    cooling.buttons.get('loop')!.disabled = s.size === 'itx';
    loopNote.hidden = s.size !== 'itx';
    rgbLabel.textContent = s.cooling === 'loop' ? 'Lighting & coolant' : 'Lighting';
    rgbColor.el.classList.toggle('dim', s.rgb === 'off' && s.cooling !== 'loop');
    toggle.style.setProperty('--c', s.rgb === 'off' ? s.caseColor : s.rgbColor);
  }

  subscribe((s, prev) => {
    if (s.setup !== prev.setup) sync();
  });
  sync();
}
