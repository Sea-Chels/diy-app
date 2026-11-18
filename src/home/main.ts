import '../shared/base.css';
import './home.css';
import { createScene } from './scene/scene';
import { AREAS, type AreaId } from './data/areas';
import { getState, setState, subscribe } from './store';
import { mountHomeMenu } from './ui/homeMenu';
import { mountPanel } from './ui/panel';
import { openGuideIndex } from './ui/guideIndex';
import { openToolbox } from './ui/toolbox';
import { openCalculators } from './ui/calculators';
import { GUIDES, GUIDE_BY_ID } from './data/guides';
import { h } from '../shared/dom';
import { hydrateIcons } from '../shared/icons';
import { hideLoaderAfterFrames } from '../shared/loader';

hydrateIcons();

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = createScene(canvas, getState().setup);
mountHomeMenu(document.getElementById('home-menu')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);
document.getElementById('toolbox-btn')!.addEventListener('click', openToolbox);
document.getElementById('calc-btn')!.addEventListener('click', () => openCalculators());

scene.onSelect((area) => {
  if (area === getState().selectedArea) return;
  setState({ selectedArea: area, openGuide: null });
});

const hint = document.getElementById('hint')!;
const IDLE_HINT = 'Drag to look around. Click a glowing dot.';
scene.onHover((area) => {
  hint.textContent = area ? AREAS[area].label : IDLE_HINT;
  hint.classList.toggle('active', Boolean(area));
});

subscribe((s, prev) => {
  if (s.selectedArea !== prev.selectedArea) scene.focus(s.selectedArea);
  if (s.selectedArea !== prev.selectedArea || s.openGuide !== prev.openGuide) {
    const hash = s.openGuide ? `#${s.openGuide}` : s.selectedArea ? `#${s.selectedArea}` : '';
    history.replaceState(null, '', hash || location.pathname + location.search);
  }
  if (s.setup !== prev.setup) scene.setSetup(s.setup);
});

// Popular guides bar.
const quick = document.getElementById('quick-fixes')!;
for (const g of GUIDES) {
  if (g.featured) quick.append(h('button', { class: 'quick-chip', onClick: () => setState({ selectedArea: g.areas[0], openGuide: g.id }) }, g.title));
}
quick.append(h('button', { class: 'quick-chip more', onClick: openGuideIndex }, 'All guides…'));

// Deep links: #running-toilet or #toilet
function applyHash(): void {
  const id = location.hash.slice(1);
  if (!id) return setState({ selectedArea: null, openGuide: null });
  const guide = GUIDE_BY_ID.get(id);
  if (guide) setState({ selectedArea: guide.areas[0], openGuide: guide.id });
  else if (id in AREAS) setState({ selectedArea: id as AreaId, openGuide: null });
}
window.addEventListener('hashchange', applyHash);
if (location.hash) applyHash();

hideLoaderAfterFrames();
