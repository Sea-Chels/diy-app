import * as THREE from 'three';
import { tween } from '../../../shared/tween';
import { M, rbox } from '../kit';
import type { CarCtx } from '../ctx';

export function buildWipers(c: CarCtx) {
  const { S, kind, group, put, tag, roofLine } = c;
  const wipers: THREE.Mesh[] = [];
  const wipeArms: THREE.Group[] = [];
  const wipeZ = S.cowlZ - 0.08;
  const wipeSlope = (roofLine(wipeZ - 0.08) - roofLine(wipeZ + 0.04)) / 0.12;
  const bladeLen = S.ghW[1] * 0.72;
  const WIPER_REST = -0.05;
  for (const px of [S.ghW[1] * 0.66, -S.ghW[1] * 0.06]) {
    // base frame: local y = windshield normal, local -z = up the glass
    const base = new THREE.Group();
    base.position.set(px, roofLine(wipeZ) + 0.02, wipeZ);
    base.rotation.x = Math.atan(wipeSlope);
    group.add(base);
    const arm = new THREE.Group();
    arm.rotation.y = WIPER_REST;
    base.add(arm);
    wipers.push(put(arm, rbox(bladeLen, 0.016, 0.028, 0.007), M.trim(), [-bladeLen / 2, 0.006, 0], 'thin'));
    const hub = put(arm, new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), M.trim(), [0, 0.006, 0], 'thin');
    wipers.push(hub);
    wipeArms.push(arm);
  }
  tag('wiper', ...wipers);
  const wipe = () =>
    tween({
      duration: 1700,
      ease: (k) => k,
      tag: `wipe:${kind}`,
      update: (k) => {
        const a = 0.5 - 0.5 * Math.cos(k * Math.PI * 4); // two full sweeps
        wipeArms.forEach((arm, i) => (arm.rotation.y = WIPER_REST - 1.3 * Math.max(0, a - i * 0.03)));
      },
    });
  return { wipeZ, wipe };
}
