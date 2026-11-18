import '../shared/base.css';
import '../shared/workshop.css';
import { createScene, type Appearance } from './scene/scene';
import { PARTS, type PartId } from './data/parts';
import { GUIDES, GUIDE_BY_ID, appliesTo } from './data/guides';
import { guessBody } from './data/makes';
import { FINISHES } from './data/paint';
import { getState, setState, subscribe } from './store';
import { mountVehiclePicker } from './ui/vehiclePicker';
import { mountPaintShop } from './ui/paintShop';
import { mountPanel } from './ui/panel';
import { openGuideIndex } from './ui/guideIndex';
import { h, clear } from '../shared/dom';
import { hydrateIcons } from '../shared/icons';
import { hideLoaderAfterFrames } from '../shared/loader';

hydrateIcons();

function appearance(): Appearance {
  const { appearance: a, vehicle: v } = getState();
  const f = FINISHES[a.finish];
  return { kind: a.body === 'auto' ? guessBody(v.make, v.model) : a.body, color: a.color, shine: f.shine, metal: f.metal };
}

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = createScene(canvas, appearance());
mountPaintShop(document.getElementById('paint-shop')!);
mountVehiclePicker(document.getElementById('vehicle-picker')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);

scene.onSelect((part) => {
  if (part === getState().selectedPart) return;
  setState({ selectedPart: part, openGuide: null });
});

const hint = document.getElementById('hint')!;
const IDLE_HINT = 'Drag to look around. Click a glowing dot.';
scene.onHover((part) => {
  hint.textContent = part ? PARTS[part].label : IDLE_HINT;
  hint.classList.toggle('active', Boolean(part));
});

subscribe((s, prev) => {
  if (s.selectedPart !== prev.selectedPart) scene.focus(s.selectedPart);
  if (s.selectedPart !== prev.selectedPart || s.openGuide !== prev.openGuide) {
    const hash = s.openGuide ? `#${s.openGuide}` : s.selectedPart ? `#${s.selectedPart}` : '';
    history.replaceState(null, '', hash || location.pathname + location.search);
  }
  if (s.vehicle.powertrain !== prev.vehicle.powertrain) renderQuickFixes();
  if (s.appearance !== prev.appearance || s.vehicle !== prev.vehicle) scene.setSetup(appearance());
});

const quick = document.getElementById('quick-fixes')!;
function renderQuickFixes(): void {
  clear(quick);
  const pt = getState().vehicle.powertrain;
  for (const g of GUIDES) {
    if (!g.featured || !appliesTo(g, pt)) continue;
    quick.append(h('button', { class: 'quick-chip', onClick: () => setState({ selectedPart: g.parts[0], openGuide: g.id }) }, g.title));
  }
  quick.append(h('button', { class: 'quick-chip more', onClick: openGuideIndex }, 'All fixes…'));
}
renderQuickFixes();

// Deep link: #oil-change or #battery
function applyHash(): void {
  const id = location.hash.slice(1);
  if (!id) return setState({ selectedPart: null, openGuide: null });
  const guide = GUIDE_BY_ID.get(id);
  if (guide) setState({ selectedPart: guide.parts[0], openGuide: guide.id });
  else if (Object.hasOwn(PARTS, id)) setState({ selectedPart: id as PartId, openGuide: null });
}
window.addEventListener('hashchange', applyHash);
if (location.hash) applyHash();

hideLoaderAfterFrames();
