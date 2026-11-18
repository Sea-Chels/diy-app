import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { C, rbox } from '../kit';
import type { CarCtx } from '../ctx';

export function buildFront(c: CarCtx) {
  const { S, group, put, tag, chromeMat, fasciaTop, fasciaBottom } = c;
  // Lamps sit on the flat part of the nose, not on its rounded top edge.
  const lightY = (fasciaTop(S.noseZ) + fasciaBottom(S.noseZ)) / 2 + 0.06;
  const headMat = () => toon(C.lamp, { emissive: C.lampGlow, emissiveIntensity: 0.35, shine: 0.9, halftone: 0 });
  const heads: THREE.Mesh[] = [];
  const lampW = 0.42;
  const lampH = S.suv ? 0.19 : 0.16;
  const glow = () => toon(C.lampEye, { emissive: C.lampEye, emissiveIntensity: 1, halftone: 0 });
  for (const side of [1, -1]) {
    const lamp = new THREE.Group();
    lamp.position.set(side * 0.53, lightY, S.noseZ - 0.04);
    lamp.rotation.y = side * 0.22;
    group.add(lamp);
    heads.push(put(lamp, rbox(lampW + 0.03, lampH + 0.03, 0.06, 0.07), toon(C.lampBezel, { halftone: 0 }), [0, 0, -0.005], 'thin'));
    heads.push(put(lamp, rbox(lampW, lampH, 0.08, 0.075), headMat(), [0, 0, 0.022]));
    const eye = put(lamp, new THREE.CylinderGeometry(lampH * 0.34, lampH * 0.34, 0.02, 28), glow(), [side * 0.075, 0.005, 0.066], 'thin');
    eye.rotation.x = Math.PI / 2;
    heads.push(eye);
    heads.push(put(lamp, rbox(lampW * 0.42, 0.022, 0.012, 0.009), glow(), [-side * 0.08, -lampH * 0.28, 0.064], false));
  }
  tag('headlight', ...heads);
  const grilleH = Math.min(0.2, lightY - fasciaBottom(S.noseZ) - 0.06);
  put(group, rbox(0.56, grilleH, 0.06, 0.05), toon(C.trim, { halftone: 0.5 }), [0, lightY - 0.02, S.noseZ - 0.01]);
  for (let i = 0; i < 3; i++) {
    put(group, rbox(0.5, 0.018, 0.02, 0.008), chromeMat(), [0, lightY - 0.02 - grilleH / 2 + (grilleH * (i + 1)) / 4, S.noseZ + 0.02], false);
  }
  put(group, rbox(0.32, 0.1, 0.012, 0.01), toon(C.plate, { shine: 0.5 }), [0, fasciaBottom(S.noseZ) + 0.1, S.noseZ + 0.005], 'thin');
  put(group, rbox(1.5, 0.07, 0.16, 0.03), toon(C.trim, { halftone: 0.5 }), [0, S.bottom + 0.05, S.noseZ - 0.12], 'thin');
  return { lightY };
}
