import '../shared/base.css';
import '../shared/workshop.css';
import './home.css';
import { createScene } from './scene/scene';
import { AREAS, type AreaId } from './data/areas';
import { getState, select, store, subscribe } from './store';
import { mountHomeMenu } from './ui/homeMenu';
import { mountPanel } from './ui/panel';
import { openGuideIndex } from './ui/guideIndex';
import { openToolbox } from './ui/toolbox';
import { openCalculators } from './ui/calculators';
import { BOOK } from './data/guides';
import { hydrateIcons } from '../shared/icons';
import { hideLoaderAfterFrames } from '../shared/loader';
import { wireWorkshop } from '../shared/workshop';

hydrateIcons();

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = createScene(canvas, getState().setup);
mountHomeMenu(document.getElementById('home-menu')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);
document.getElementById('toolbox-btn')!.addEventListener('click', openToolbox);
document.getElementById('calc-btn')!.addEventListener('click', () => openCalculators());

const FEATURED = BOOK.all.filter((g) => g.featured);

subscribe((s, prev) => {
  if (s.setup !== prev.setup) scene.setSetup(s.setup);
});

// Deep links: #running-toilet or #toilet
wireWorkshop({
  scene,
  store,
  select,
  book: BOOK,
  label: (area) => AREAS[area].label,
  isSpot: (id): id is AreaId => Object.hasOwn(AREAS, id),
  quick: { featured: () => FEATURED, more: 'All guides…', openIndex: openGuideIndex },
});

hideLoaderAfterFrames();
