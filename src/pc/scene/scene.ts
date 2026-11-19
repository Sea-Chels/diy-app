import { LIDS, PARTS, type LidId, type PartId } from '../data/parts';
import type { Setup } from '../data/setup';
import { buildRig, rigKey, type Rig } from './rig';
import type { Specs } from './screen';
import { createStage } from '../../shared/scene/stage';
import { BEACON_PULSE, OBJECT_KEY, objectRims } from '../../shared/scene/presets';
import { LIGHT } from '../../shared/theme';

export function createScene(canvas: HTMLCanvasElement, initial: Setup, initialSpecs: Specs) {
  let specs = initialSpecs;
  const stage = createStage<Setup, PartId, LidId, Rig>(canvas, {
    initial,
    build: (s) => {
      const rig = buildRig(s);
      rig.setLook(s);
      rig.setSpecs(specs);
      return rig;
    },
    rigKey,
    restyle: (rig, s) => rig.setLook(s),
    lids: LIDS,
    opens: (p) => PARTS[p].opens,
    highlight: 'hull',
    reflyOnSwap: true,
    near: 0.05,
    controls: { minDistance: 0.7, maxDistance: 14, polarMargin: 0.03, pan: false, rotateSpeed: 0.45 },
    sky: { color: LIGHT.skyObject, intensity: 0.8 },
    key: { ...OBJECT_KEY, pos: [-4, 7, 5], shadowExtent: 4 },
    rims: objectRims(1),
    front: { pos: [-3, 3, 7], intensity: 0.35 },
    ground: { center: [0.8, 0, 0.6], disc: 5.2, ring: [4.6, 5.2], ringY: 0.001, segments: 64 },
    fit: { base: 1.6, min: 1, max: 2.7, raiseLimit: false },
    flight: { ms: 1100, lift: 0.6 },
    framing: { desktop: { pullback: 1, shift: 0.2 }, phone: { pullback: 1.35 } },
    beaconPulse: BEACON_PULSE,
    beaconScale: { near: 4.5, max: 1 },
    debugName: 'pc',
  });
  return {
    ...stage,
    setSpecs(sp: Specs): void {
      specs = sp;
      stage.rig().setSpecs(sp);
      stage.invalidate();
    },
  };
}
