import { AREAS, type AreaId, type LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { buildRig, rigKey } from './rig';
import { createStage } from '../../shared/scene/stage';

const LIDS: LidId[] = ['sinkDoors', 'sash', 'tankLid', 'vanityDoors', 'panelDoor', 'coverPlates', 'frontDoor', 'canopy', 'drawer', 'planks', 'gutterGuard', 'sidingPanel'];

export function createScene(canvas: HTMLCanvasElement, initial: Setup) {
  return createStage<Setup, AreaId, LidId, ReturnType<typeof buildRig>>(canvas, {
    initial,
    build: buildRig,
    rigKey,
    lids: LIDS,
    opens: (a) => AREAS[a].opens,
    highlight: 'outline',
    controls: { minDistance: 0.6, maxDistance: 12, polarMargin: 0.04, pan: false, rotateSpeed: 0.3 },
    sky: { color: 0xd9e2ff, intensity: 0.85 },
    // From the open front-right corner, so it falls into the room.
    key: { pos: [4, 9, 7], intensity: 1.5, shadowMap: 4096, shadowExtent: 5.4, shadowFar: 30, bias: -0.0004 },
    rims: { pink: { pos: [7, 3, -5], intensity: 0.7 }, cyan: { pos: [-7, 2.5, -6], intensity: 0.6 } },
    frontPos: [-3, 3, 8],
    ground: { center: [0, -0.21, 0], disc: 3.25, ring: [3.25, 3.62], ringY: -0.208, segments: 72 },
    fit: { base: 1.48, min: 0.85, max: 3.2, raiseLimit: true },
    flight: { ms: 1200, lift: 0.8 },
    phoneBackoff: 1.3,
    beaconScale: { near: 6, max: 1.3 },
    debugName: 'home',
  });
}
