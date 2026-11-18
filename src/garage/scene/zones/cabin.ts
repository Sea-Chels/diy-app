import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { mapped } from '../../../shared/scene/kit';
import { C, decal, rbox } from '../kit';
import { gaugeTex, screenTex, seatTex } from '../textures';
import type { CarCtx } from '../ctx';

export function buildCabin(c: CarCtx) {
  const { S, group, put, tag, chromeMat } = c;
  const seatMat = () => mapped(0xffffff, seatTex(), { halftone: 0.7 });
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
  const dashBack = dashZ - 0.15;
  const binnacle = put(group, rbox(0.36, 0.06, 0.12, 0.03), toon(C.trim, { halftone: 0.7 }), [0.36, S.belt + 0.08, dashZ - 0.08], 'thin');
  const gauges = decal(group, gaugeTex(), 0.32, 0.12, [0.36, S.belt - 0.005, dashBack - 0.004], [0, Math.PI, 0], { glow: true });
  const screen = decal(group, screenTex(), 0.22, 0.135, [0, S.belt - 0.01, dashBack - 0.004], [0, Math.PI, 0], { glow: true });
  const wheel = new THREE.Group();
  wheel.position.set(0.36, S.belt + 0.06, dashZ - 0.2);
  wheel.rotation.x = -1.15;
  group.add(wheel);
  const rim = put(wheel, new THREE.TorusGeometry(0.15, 0.022, 10, 32), toon(C.trim), undefined, 'thin');
  const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.035, 18);
  hubGeo.rotateX(Math.PI / 2);
  const hub = put(wheel, hubGeo, toon(C.trim, { shine: 0.4 }), undefined, 'thin');
  const spokes = [0, Math.PI / 2, Math.PI].map((a) => {
    const sp = put(wheel, rbox(0.12, 0.028, 0.014, 0.006), toon(C.trim), [Math.cos(a) * 0.08, -Math.sin(a) * 0.08, 0], false);
    sp.rotation.z = -a;
    return sp;
  });
  const consoleLen = dashBack - S.seatZ;
  const centre = put(group, rbox(0.2, 0.17, consoleLen, 0.04), toon(C.trim, { halftone: 0.7 }), [0, S.floorY + 0.1, S.seatZ + consoleLen / 2], 'thin');
  const shifter = put(group, new THREE.CylinderGeometry(0.012, 0.012, 0.08, 10), chromeMat(), [0, S.floorY + 0.22, dashBack - 0.16], false);
  const knob = put(group, new THREE.SphereGeometry(0.026, 14, 10), toon(C.trim, { shine: 0.6 }), [0, S.floorY + 0.27, dashBack - 0.16], 'thin');
  const fuseCabin = put(group, rbox(0.15, 0.1, 0.05, 0.01), toon(C.fuse), [S.ghW[0] - 0.16, S.belt - 0.16, dashZ - 0.12], 'thin');
  tag('cabin', ...seatParts, dash, binnacle, gauges, screen, rim, hub, ...spokes, centre, shifter, knob);
  tag('fusebox_cabin', fuseCabin);
  return { dashZ };
}
