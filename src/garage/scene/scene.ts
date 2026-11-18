import { createStage } from '../../shared/scene/stage';
import { lidsFor, LIDS, type LidId, type PartId } from '../data/parts';
import type { BodyKind } from '../data/paint';
import type { RideId } from '../data/rides';
import type { Paint } from './rig';
import { buildGarage, type GarageRig } from './garage';

export interface Appearance extends Paint {
  kind: BodyKind;
  ride: RideId;
}

export function createScene(canvas: HTMLCanvasElement, initial: Appearance) {
  return createStage<Appearance, PartId, LidId, GarageRig>(canvas, {
    initial,
    build: (a) => {
      const rig = buildGarage(a.kind, a.ride);
      rig.setPaint(a, true);
      return rig;
    },
    rigKey: (a) => a.kind,
    restyle: (rig, a) => {
      rig.setPaint(a);
      rig.setRide(a.ride);
    },
    swapTarget: (rig) => rig.car,
    lids: LIDS,
    opens: lidsFor,
    highlight: 'hull',
    reflyOnSwap: true,
    near: 0.1,
    controls: { minDistance: 1.2, maxDistance: 14, polarMargin: 0.03, pan: false, rotateSpeed: 0.5 },
    sky: { color: 0xc9d2ff, intensity: 0.75 },
    key: { pos: [4, 7, 5], intensity: 1.45, shadowMap: 2048, shadowExtent: 5, shadowFar: 25, bias: -0.0005 },
    rims: { pink: { pos: [-6, 3, -4], intensity: 0.9 }, cyan: { pos: [6, 2.5, -5], intensity: 0.8 } },
    front: { pos: [-2, 3, 7], intensity: 0.3 },
    ground: { center: [0, 0, 0], disc: 7, ring: [6.2, 7], ringY: 0.001, segments: 64 },
    fit: { base: 1.6, min: 1, max: 2.6, raiseLimit: true },
    flight: { ms: 950, lift: 0 },
    framing: { desktop: { pullback: 1.3, shift: 0.18 }, phone: { pullback: 1.3, drop: 0 } },
    beaconPulse: { amp: 0.18, speed: 2.4 },
    beaconScale: null,
    debugName: 'garage',
  });
}
