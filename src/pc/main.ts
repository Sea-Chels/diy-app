import '../shared/base.css';
import './pc.css';
import { createScene } from './scene/scene';
import { PARTS, type PartId } from './data/parts';
import { GUIDES, GUIDE_BY_ID, appliesTo } from './data/guides';
import { getState, setState, subscribe } from './store';
import { mountPanel } from './ui/panel';
import { mountRigMenu } from './ui/rigMenu';
import { openGuideIndex } from './ui/guideIndex';
import { openBuilder } from './ui/builder';
import { specsFor } from './ui/context';
import { h, clear } from '../shared/dom';
import { hydrateIcons } from '../shared/icons';

hydrateIcons();

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = createScene(canvas, getState().setup, specsFor(getState().build));
mountRigMenu(document.getElementById('rig-menu')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);
document.getElementById('builder-btn')!.addEventListener('click', () => openBuilder());

// 3D → state
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

// state → 3D + URL hash
subscribe((s, prev) => {
  if (s.selectedPart !== prev.selectedPart) scene.focus(s.selectedPart);
  if (s.selectedPart !== prev.selectedPart || s.openGuide !== prev.openGuide) {
    const hash = s.openGuide ? `#${s.openGuide}` : s.selectedPart ? `#${s.selectedPart}` : '';
    history.replaceState(null, '', hash || location.pathname + location.search);
  }
  if (s.setup !== prev.setup) scene.setSetup(s.setup);
  if (s.build !== prev.build) scene.setSpecs(specsFor(s.build));
  if (s.setup.cooling !== prev.setup.cooling) renderQuickFixes();
});

// Popular guides bar.
const quick = document.getElementById('quick-fixes')!;
function renderQuickFixes(): void {
  clear(quick);
  const cooling = getState().setup.cooling;
  for (const g of GUIDES) {
    if (!g.featured || !appliesTo(g, cooling)) continue;
    quick.append(h('button', { class: 'quick-chip', onClick: () => setState({ selectedPart: g.parts[0], openGuide: g.id }) }, g.title));
  }
  quick.append(h('button', { class: 'quick-chip more', onClick: openGuideIndex }, 'All guides…'));
}
renderQuickFixes();

// Deep link: #install-windows or #gpu
function applyHash(): void {
  const id = location.hash.slice(1);
  if (!id) return setState({ selectedPart: null, openGuide: null });
  const guide = GUIDE_BY_ID.get(id);
  if (guide) setState({ selectedPart: guide.parts[0], openGuide: guide.id });
  else if (id in PARTS) setState({ selectedPart: id as PartId, openGuide: null });
}
window.addEventListener('hashchange', applyHash);
if (location.hash) applyHash();
