import '../shared/base.css';
import '../shared/workshop.css';
import './pc.css';
import { createScene } from './scene/scene';
import { PARTS, type PartId } from './data/parts';
import { BOOK, appliesTo } from './data/guides';
import { getState, select, store, subscribe } from './store';
import { mountPanel } from './ui/panel';
import { mountRigMenu } from './ui/rigMenu';
import { openGuideIndex } from './ui/guideIndex';
import { openBuilder } from './ui/builder';
import { specsFor } from './ui/context';
import { hydrateIcons } from '../shared/icons';
import { hideLoaderAfterFrames } from '../shared/loader';
import { sceneOr } from '../shared/scene/fallback';
import { wireWorkshop } from '../shared/workshop';

hydrateIcons();

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = sceneOr(canvas, () => createScene(canvas, getState().setup, specsFor(getState().build)));
mountRigMenu(document.getElementById('rig-menu')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);
document.getElementById('builder-btn')!.addEventListener('click', () => openBuilder());

subscribe((s, prev) => {
  if (s.setup !== prev.setup) scene.setSetup(s.setup);
  if (s.build !== prev.build) scene.setSpecs(specsFor(s.build));
});

// Deep links: #install-windows or #gpu
wireWorkshop({
  scene,
  store,
  select,
  book: BOOK,
  label: (part) => PARTS[part].label,
  isSpot: (id): id is PartId => Object.hasOwn(PARTS, id),
  quick: {
    featured: (s) => BOOK.all.filter((g) => g.featured && appliesTo(g, s.setup.cooling)),
    more: 'All guides…',
    openIndex: openGuideIndex,
    refresh: (s, prev) => s.setup.cooling !== prev.setup.cooling,
  },
});

hideLoaderAfterFrames();
