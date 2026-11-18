import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, mapped } from '../../../shared/scene/kit';
import { C, M, decal, rbox } from '../kit';
import { gaugeTex, screenTex, seatTex } from '../textures';
import type { CarCtx } from '../ctx';

export function buildCabin(c: CarCtx) {
  const { S, group, tag } = c;
  const seatMat = () => mapped(0xffffff, seatTex(), { halftone: 0.7 });
  const seatParts: THREE.Mesh[] = [];
  const cushionY = S.floorY + 0.14;
  const backTop = S.belt + 0.2;
  const backH = backTop - (cushionY - 0.04);
  for (const x of [0.36, -0.36]) {
    seatParts.push(add(rbox(0.4, 0.13, 0.44, 0.05), seatMat(), group, { at: [x, cushionY, S.seatZ] }));
    const back = add(rbox(0.4, backH, 0.12, 0.05), seatMat(), group, { at: [x, cushionY - 0.04 + backH / 2, S.seatZ - 0.24] });
    back.rotation.x = -0.12;
    seatParts.push(back);
    seatParts.push(add(rbox(0.22, 0.13, 0.09, 0.04), seatMat(), group, { at: [x, backTop + 0.1, S.seatZ - 0.27] }));
  }
  if (S.rearSeatZ !== null) {
    const rearBackH = backTop - 0.04 - (cushionY - 0.04);
    seatParts.push(add(rbox(1.24, 0.13, 0.42, 0.05), seatMat(), group, { at: [0, cushionY, S.rearSeatZ] }));
    const rb = add(rbox(1.24, rearBackH, 0.12, 0.05), seatMat(), group, { at: [0, cushionY - 0.04 + rearBackH / 2, S.rearSeatZ - 0.22] });
    rb.rotation.x = -0.14;
    seatParts.push(rb);
  }
  const dashZ = S.cowlZ - 0.22;
  const dash = add(rbox(S.ghW[0] * 2 - 0.14, 0.2, 0.3, 0.05), toon(C.trim, { halftone: 0.7 }), group, { at: [0, S.belt - 0.04, dashZ] });
  const dashBack = dashZ - 0.15;
  const binnacle = add(rbox(0.36, 0.06, 0.12, 0.03), toon(C.trim, { halftone: 0.7 }), group, { at: [0.36, S.belt + 0.08, dashZ - 0.08] });
  const gauges = decal(group, gaugeTex(), 0.32, 0.12, [0.36, S.belt - 0.005, dashBack - 0.004], [0, Math.PI, 0], { glow: true });
  const screen = decal(group, screenTex(), 0.22, 0.135, [0, S.belt - 0.01, dashBack - 0.004], [0, Math.PI, 0], { glow: true });
  const wheel = new THREE.Group();
  wheel.position.set(0.36, S.belt + 0.06, dashZ - 0.2);
  wheel.rotation.x = -1.15;
  group.add(wheel);
  const rim = add(new THREE.TorusGeometry(0.15, 0.022, 10, 32), M.trim(), wheel);
  const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.035, 18);
  hubGeo.rotateX(Math.PI / 2);
  const hub = add(hubGeo, toon(C.trim, { shine: 0.4 }), wheel);
  const spokes = [0, Math.PI / 2, Math.PI].map((a) => {
    const sp = add(rbox(0.12, 0.028, 0.014, 0.006), M.trim(), wheel, { at: [Math.cos(a) * 0.08, -Math.sin(a) * 0.08, 0], ink: null });
    sp.rotation.z = -a;
    return sp;
  });
  const consoleLen = dashBack - S.seatZ;
  const center = add(rbox(0.2, 0.17, consoleLen, 0.04), toon(C.trim, { halftone: 0.7 }), group, { at: [0, S.floorY + 0.1, S.seatZ + consoleLen / 2] });
  const shifter = add(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 10), M.chrome(), group, { at: [0, S.floorY + 0.22, dashBack - 0.16], ink: null });
  const knob = add(new THREE.SphereGeometry(0.026, 14, 10), toon(C.trim, { shine: 0.6 }), group, { at: [0, S.floorY + 0.27, dashBack - 0.16] });
  const fuseCabin = add(rbox(0.15, 0.1, 0.05, 0.01), toon(C.darkPart), group, { at: [S.ghW[0] - 0.16, S.belt - 0.16, dashZ - 0.12] });
  tag('cabin', ...seatParts, dash, binnacle, gauges, screen, rim, hub, ...spokes, center, shifter, knob);
  tag('fusebox_cabin', fuseCabin);
  return { dashZ };
}
