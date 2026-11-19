import '../shared/base.css';
import '../shared/workshop.css';
import './garden.css';
import { createScene } from './scene/scene';
import { AREAS, type AreaId } from './data/areas';
import { getState, select, store, subscribe } from './store';
import { mountGardenMenu } from './ui/gardenMenu';
import { mountPanel } from './ui/panel';
import { openGuideIndex } from './ui/guideIndex';
import { openPlantGuide } from './ui/plantGuide';
import { openPlanner } from './ui/planner';
import { BOOK } from './data/guides';
import { PLANT_BY_ID } from './data/plants';
import { hydrateIcons } from '../shared/icons';
import { hideLoaderAfterFrames } from '../shared/loader';
import { sceneOr } from '../shared/scene/fallback';
import { wireWorkshop } from '../shared/workshop';

hydrateIcons();

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = sceneOr(canvas, () => createScene(canvas, getState().setup));
mountGardenMenu(document.getElementById('garden-menu')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);
document.getElementById('plants-btn')!.addEventListener('click', () => openPlantGuide());
document.getElementById('planner-btn')!.addEventListener('click', openPlanner);

const FEATURED = BOOK.all.filter((g) => g.featured);

subscribe((s, prev) => {
  if (s.setup !== prev.setup) scene.setSetup(s.setup);
});

// Deep links: #hot-compost, #compost or #plant=pawpaw
wireWorkshop({
  scene,
  store,
  select,
  book: BOOK,
  label: (area) => AREAS[area].label,
  isSpot: (id): id is AreaId => Object.hasOwn(AREAS, id),
  quick: { featured: () => FEATURED, more: 'All guides…', openIndex: openGuideIndex },
  hash: (id) => {
    const plant = id.startsWith('plant=') ? id.slice(6) : '';
    if (PLANT_BY_ID.has(plant)) openPlantGuide(plant);
  },
});

hideLoaderAfterFrames();
