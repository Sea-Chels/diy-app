import '../shared/base.css';
import '../shared/workshop.css';
import './garage.css';
import { createScene, type Appearance } from './scene/scene';
import { PARTS, rideOf, type PartId } from './data/parts';
import { BOOK, appliesTo } from './data/guides';
import { guessBody } from './data/makes';
import { FINISHES } from './data/paint';
import { getState, select, store, subscribe } from './store';
import { mountVehiclePicker } from './ui/vehiclePicker';
import { mountPaintShop } from './ui/paintShop';
import { mountRideSwitch } from './ui/rideSwitch';
import { mountPanel } from './ui/panel';
import { openGuideIndex } from './ui/guideIndex';
import { hydrateIcons } from '../shared/icons';
import { hideLoaderAfterFrames } from '../shared/loader';
import { wireWorkshop } from '../shared/workshop';

hydrateIcons();

function appearance(): Appearance {
  const { appearance: a, vehicle: v, ride } = getState();
  const f = FINISHES[a.finish];
  return { kind: a.body === 'auto' ? guessBody(v.make, v.model) : a.body, ride, color: a.color, shine: f.shine, metal: f.metal };
}

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const scene = createScene(canvas, appearance());
mountPaintShop(document.getElementById('paint-shop')!);
mountRideSwitch(document.getElementById('ride-switch')!, () => scene.focus(null));
mountVehiclePicker(document.getElementById('vehicle-picker')!);
mountPanel(document.getElementById('panel')!);
document.getElementById('guides-btn')!.addEventListener('click', openGuideIndex);

// The ride goes to the scene before the shared wiring's focus, so a focus that follows flies to the right vehicle.
subscribe((s, prev) => {
  if (s.appearance !== prev.appearance || s.vehicle !== prev.vehicle || s.ride !== prev.ride) scene.setSetup(appearance());
});

// Deep links: #oil-change or #battery
wireWorkshop({
  scene,
  store,
  select,
  book: BOOK,
  label: (part) => PARTS[part].label,
  isSpot: (id): id is PartId => Object.hasOwn(PARTS, id),
  quick: {
    featured: (s) => BOOK.all.filter((g) => g.featured && rideOf(g.spots[0]) === s.ride && appliesTo(g, s.vehicle.powertrain)),
    more: 'All fixes…',
    openIndex: openGuideIndex,
    refresh: (s, prev) => s.vehicle.powertrain !== prev.vehicle.powertrain || s.ride !== prev.ride,
  },
  refocus: (s, prev) => s.ride !== prev.ride && !s.selected,
});

hideLoaderAfterFrames();
