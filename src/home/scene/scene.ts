import { AREAS, LIDS, type AreaId, type LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { buildRig, rigKey } from './rig';
import { createStage } from '../../shared/scene/stage';
import { SITE } from '../../shared/scene/presets';

export function createScene(canvas: HTMLCanvasElement, initial: Setup) {
  return createStage<Setup, AreaId, LidId, ReturnType<typeof buildRig>>(canvas, {
    initial,
    build: buildRig,
    rigKey,
    lids: LIDS,
    opens: (a) => AREAS[a].opens,
    ...SITE,
    controls: { minDistance: 0.6, maxDistance: 12, polarMargin: 0.04, pan: false, rotateSpeed: 0.3 },
    // From the open front-right corner, so it falls into the room.
    key: { ...SITE.key, pos: [4, 9, 7] },
    ground: { center: [0, -0.21, 0], disc: 3.25, ring: [3.25, 3.62], ringY: -0.208, segments: 72 },
    fit: { base: 1.48, min: 0.85, max: 3.2, raiseLimit: true },
    debugName: 'home',
  });
}
