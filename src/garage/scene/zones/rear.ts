import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { mapped } from '../../../shared/scene/kit';
import { C, M, rbox } from '../kit';
import { plateTex } from '../textures';
import type { CarCtx } from '../ctx';
import type { Trunk } from './trunk';

export function buildRear(c: CarCtx, trunk: Trunk) {
  const { S, group, paint, put, tag, lowerTop, lowerBottom, sideX } = c;
  const { suvTails } = trunk;
  const tails: THREE.Mesh[] = [];
  const tailTop = lowerTop(S.tailZ + 0.03);
  for (const side of [1, -1]) {
    if (S.suv) continue; // built with the liftgate
    const mat = M.lamp(C.taillight, 0.6);
    tails.push(put(group, rbox(0.42, 0.11, 0.06, 0.03), mat, [side * 0.56, tailTop - 0.1, S.tailZ + 0.0]));
    tails.push(put(group, rbox(0.1, 0.07, 0.02, 0.01), toon(C.reverse, { shine: 0.8, halftone: 0 }), [side * 0.42, tailTop - 0.1, S.tailZ - 0.03], false));
    tails.push(put(group, rbox(0.3, 0.012, 0.02, 0.004), toon(C.lampBezel), [side * 0.6, tailTop - 0.1, S.tailZ - 0.03], false));
  }
  for (const side of [1, -1]) {
    const z = S.tailZ + 0.2;
    const y = tailTop - 0.1;
    tails.push(put(group, rbox(0.012, 0.04, 0.12, 0.006), M.lamp(C.taillight, 0.5), [sideX(z, y, side, 0.004), y, z], false));
  }
  tails.push(...suvTails);
  tag('taillight', ...tails);
  if (!S.suv) put(group, rbox(0.32, 0.1, 0.012, 0.01), mapped(0xffffff, plateTex(), { shine: 0.5, halftone: 0.3 }), [0, lowerBottom(S.tailZ) + 0.12, S.tailZ - 0.005], 'thin');
  put(group, rbox(1.5, 0.08, 0.14, 0.03), toon(C.trim, { halftone: 0.5 }), [0, S.bottom + 0.06, S.tailZ + 0.08], 'thin');

  const tipZ = S.tailZ - 0.04;
  const pipe = put(group, new THREE.CylinderGeometry(0.035, 0.035, 1.2, 12), toon(C.disc, { metal: 0.6 }), [-0.5, S.bottom - 0.04, S.tailZ + 0.6], false);
  pipe.rotation.x = Math.PI / 2;
  const tip = put(group, new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), M.chrome(), [-0.5, S.bottom - 0.03, tipZ], 'thin');
  tip.rotation.x = Math.PI / 2;
  tag('exhaust', pipe, tip);

  const fuelZ = S.wheelZ[1] - (S.suv ? 0.05 : 0.3);
  const fuelY = S.belt - 0.13;
  const fuel = put(group, new THREE.CylinderGeometry(0.075, 0.075, 0.014, 24), paint(), [sideX(fuelZ, fuelY, -1, 0.006), fuelY, fuelZ], 'thin');
  fuel.rotation.z = Math.PI / 2;
  tag('fueldoor', fuel);
  return { tailTop, tipZ, fuelY, fuelZ };
}
