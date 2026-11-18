import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { C, rbox } from '../kit';
import type { CarCtx } from '../ctx';

export function buildCabin(c: CarCtx) {
  const { S, group, put, tag } = c;
  const seatMat = () => toon(C.seat, { halftone: 0.7 });
  const seatParts: THREE.Mesh[] = [];
  const cushionY = S.floorY + 0.14;
  const backTop = S.belt + 0.2;
  const backH = backTop - (cushionY - 0.04);
  for (const x of [0.36, -0.36]) {
    seatParts.push(put(group, rbox(0.4, 0.13, 0.44, 0.05), seatMat(), [x, cushionY, S.seatZ], 'thin'));
    const back = put(group, rbox(0.4, backH, 0.12, 0.05), seatMat(), [x, cushionY - 0.04 + backH / 2, S.seatZ - 0.24], 'thin');
    back.rotation.x = -0.12;
    seatParts.push(back);
    seatParts.push(put(group, rbox(0.22, 0.13, 0.09, 0.04), seatMat(), [x, backTop + 0.1, S.seatZ - 0.27], 'thin'));
  }
  if (S.rearSeatZ !== null) {
    const rearBackH = backTop - 0.04 - (cushionY - 0.04);
    seatParts.push(put(group, rbox(1.24, 0.13, 0.42, 0.05), seatMat(), [0, cushionY, S.rearSeatZ], 'thin'));
    const rb = put(group, rbox(1.24, rearBackH, 0.12, 0.05), seatMat(), [0, cushionY - 0.04 + rearBackH / 2, S.rearSeatZ - 0.22], 'thin');
    rb.rotation.x = -0.14;
    seatParts.push(rb);
  }
  const dashZ = S.cowlZ - 0.22;
  const dash = put(group, rbox(S.ghW[0] * 2 - 0.14, 0.2, 0.3, 0.05), toon(C.trim, { halftone: 0.7 }), [0, S.belt - 0.04, dashZ], 'thin');
  const steering = put(group, new THREE.TorusGeometry(0.15, 0.022, 10, 32), toon(C.trim), [0.36, S.belt + 0.06, dashZ - 0.2], 'thin');
  steering.rotation.x = -1.15;
  const fuseCabin = put(group, rbox(0.15, 0.1, 0.05, 0.01), toon(C.fuse), [S.ghW[0] - 0.16, S.belt - 0.16, dashZ - 0.12], 'thin');
  tag('cabin', ...seatParts, dash, steering);
  tag('fusebox_cabin', fuseCabin);
  return { dashZ };
}
