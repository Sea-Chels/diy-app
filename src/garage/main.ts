import '../shared/base.css';
import '../shared/workshop.css';
import './garage.css';
import { createScene, type Appearance } from './scene/scene';
import { PARTS, PART_ORDER, rideOf, type PartId } from './data/parts';
import { BOOK, DIFFICULTY_LABEL, type Guide } from './data/guides';
import { guessBody } from './data/makes';
import { FINISHES } from './data/paint';
import { select, store, type State } from './store';
import { mountVehiclePicker } from './ui/vehiclePicker';
import { mountPaintShop } from './ui/paintShop';
import { mountRideSwitch } from './ui/rideSwitch';
import { guideCard, guideChips } from './ui/guideCard';
import type { Difficulty } from '../shared/guides';
import { mountWorkshop } from '../shared/workshop';

const ALL_PARTS = Object.keys(PARTS) as PartId[];

function appearance({ appearance: a, vehicle: v, ride }: State): Appearance {
  const f = FINISHES[a.finish];
  return { kind: a.body === 'auto' ? guessBody(v.make, v.model) : a.body, ride, color: a.color, shine: f.shine, metal: f.metal };
}

// Deep links: #oil-change or #battery
mountWorkshop({
  store,
  select,
  book: BOOK,
  spots: PARTS,
  order: PART_ORDER,
  spotNav: { label: 'Parts', ids: (s) => ALL_PARTS.filter((p) => rideOf(p) === s.ride) },
  applies: (g, s) => !g.powertrains || g.powertrains.includes(s.vehicle.powertrain),
  scene: (canvas, s) => createScene(canvas, appearance(s)),
  // The ride goes to the scene before the shared wiring's focus, so a focus that follows flies to the right vehicle.
  sync: (scene, s, prev) => {
    if (s.appearance !== prev.appearance || s.vehicle !== prev.vehicle || s.ride !== prev.ride) scene.setSetup(appearance(s));
  },
  menus: {
    'paint-shop': mountPaintShop,
    'ride-switch': (el, scene) => mountRideSwitch(el, () => scene.focus(null)),
    'vehicle-picker': mountVehiclePicker,
  },
  panel: {
    card: guideCard,
    relatedLabel: 'Nearby',
    empty: (s) => `Nothing here is a sensible DIY job on a ${s.vehicle.powertrain === 'ev' ? 'electric car' : 'car like this'}. Leave it to a shop.`,
    // The vehicle names each guide's video search.
    refresh: (s, prev) => s.vehicle !== prev.vehicle,
  },
  index: {
    title: 'Everything you can fix',
    filters: [
      { label: 'All levels', keep: () => true },
      ...([1, 2, 3] as Difficulty[]).map((d) => ({ label: DIFFICULTY_LABEL[d], keep: (g: Guide) => g.difficulty === d })),
    ],
    toggle: (s) => (on) => (on ? `${s.vehicle.powertrain.toUpperCase()} only` : 'All powertrains'),
    chips: guideChips,
    placeholder: 'Search fixes: oil, fuse, flat tire, chain…',
    empty: 'No fixes match. Try a broader word, or switch on all powertrains.',
    sub: (n) => `${n} jobs for the car, motorcycle and bike, all doable in a driveway.`,
  },
  more: 'All fixes…',
  refocus: (s, prev) => s.ride !== prev.ride && !s.selected,
});
