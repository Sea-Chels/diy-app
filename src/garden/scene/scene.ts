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
    controls: { minDistance: 0.8, maxDistance: 16, polarMargin: 0.06, pan: false, rotateSpeed: 0.3 },
    key: { ...SITE.key, pos: [-5, 9, 6] },
    ground: { center: [0, 0, 0], ring: [5.12, 5.7], ringY: 0.002, segments: 72 },
    fit: { base: 1.3, min: 0.85, max: 3, raiseLimit: true },
    debugName: 'garden',
  });
}
