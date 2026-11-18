import { AREAS, type AreaId, type LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { buildRig, rigKey } from './rig';
import { createStage } from '../../shared/scene/stage';

const LIDS: LidId[] = ['bedFront', 'shedDoors', 'compostSlats', 'rowCover'];

export function createScene(canvas: HTMLCanvasElement, initial: Setup) {
  return createStage<Setup, AreaId, LidId, ReturnType<typeof buildRig>>(canvas, {
    initial,
    build: buildRig,
    rigKey,
    lids: LIDS,
    opens: (a) => AREAS[a].opens,
    highlight: 'outline',
    near: 0.05,
    controls: { minDistance: 0.8, maxDistance: 16, polarMargin: 0.06, pan: false, rotateSpeed: 0.3 },
    sky: { color: 0xd9e2ff, intensity: 0.85 },
    key: { pos: [-5, 9, 6], intensity: 1.5, shadowMap: 4096, shadowExtent: 5.4, shadowFar: 30, bias: -0.0004 },
    rims: { pink: { pos: [7, 3, -5], intensity: 0.7 }, cyan: { pos: [-7, 2.5, -6], intensity: 0.6 } },
    front: { pos: [-3, 3, 8], intensity: 0.35 },
    ground: { center: [0, 0, 0], ring: [5.12, 5.7], ringY: 0.002, segments: 72 },
    fit: { base: 1.3, min: 0.85, max: 3, raiseLimit: true },
    flight: { ms: 1200, lift: 0.8 },
    framing: { desktop: { pullback: 1, shift: 0.2 }, phone: { pullback: 1.3, drop: 0.2 } },
    beaconPulse: { amp: 0.12, speed: 3.2 },
    beaconScale: { near: 6, max: 1.3 },
    debugName: 'garden',
  });
}
