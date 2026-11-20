import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, tube, textured } from '../../../shared/scene/kit';
import { C, M, decal, rbox } from '../kit';
import { batteryLabel, engineLabel, fuseLabel, oilIcon, radiatorTex, washerIcon } from '../textures';
import type { CarCtx } from '../ctx';
import { TONE } from '../../../shared/theme';
import { FINISH } from '../../../shared/scene/materials';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

export function buildEngineBay(c: CarCtx) {
  const { S, group, tag } = c;
  const F = S.bayFloor;
  const bz0 = S.cowlZ + 0.06;
  const bz1 = S.fasciaZ - 0.02;
  const bm = (bz0 + bz1) / 2;
  const hose = () => toon(TONE.blackPart, { shine: 0.3 });

  const block = add(rbox(0.56, 0.26, 0.4, 0.04), M.casting(), group, { at: [0.02, F + 0.13, bm] });
  const cover = add(rbox(0.5, 0.07, 0.34, 0.03), toon(TONE.cover, FINISH.satin), group, { at: [0.02, F + 0.315, bm] });
  const badge = decal(group, engineLabel(), 0.2, 0.1, [-0.09, F + 0.351, bm + 0.06], FLAT);
  const plenumZ = bm - 0.25;
  const plenum = add(new THREE.CylinderGeometry(0.05, 0.05, 0.44, 20), M.cover(), group, { at: [0, F + 0.27, plenumZ] });
  plenum.rotation.z = Math.PI / 2;
  const runners = [-0.15, -0.05, 0.05, 0.15].map((x) => tube([v(x, F + 0.28, plenumZ), v(x, F + 0.34, plenumZ + 0.07), v(x, F + 0.3, plenumZ + 0.12)], 0.026, M.cover(), group, { radial: 10 }));
  const throttle = add(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 18), M.chrome(), group, { at: [0.25, F + 0.27, plenumZ] });
  throttle.rotation.z = Math.PI / 2;

  // Accessory drive on the engine's +x end: crank, alternator and tensioner pulleys wrapped by one belt.
  const px = 0.33;
  const pulleys: [number, number, number][] = [[F + 0.08, bm + 0.04, 0.075], [F + 0.27, bm + 0.15, 0.045], [F + 0.22, bm - 0.1, 0.04]];
  const drive: THREE.Mesh[] = pulleys.map(([y, z, r]) => {
    const p = add(new THREE.CylinderGeometry(r, r, 0.035, 24), M.chrome(), group, { at: [px, y, z] });
    p.rotation.z = Math.PI / 2;
    return p;
  });
  const cy = pulleys.reduce((s, p) => s + p[0], 0) / 3;
  const cz = pulleys.reduce((s, p) => s + p[1], 0) / 3;
  const beltPts = pulleys.flatMap(([y, z, r]) => {
    const a = Math.atan2(y - cy, z - cz);
    return [-0.9, 0, 0.9].map((d) => v(px, y + Math.sin(a + d) * (r + 0.008), z + Math.cos(a + d) * (r + 0.008)));
  });
  const belt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beltPts, true), 60, 0.009, 6, true), toon(C.darkPart));
  group.add(belt);
  const alternator = add(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 20), toon(C.disc, FINISH.brushed), group, { at: [0.41, F + 0.27, bm + 0.15] });
  alternator.rotation.z = Math.PI / 2;
  tag('engine', block, cover, badge, plenum, ...runners, throttle, ...drive, belt, alternator);

  const oilCap = add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), toon(C.oil, { shine: 0.6 }), group, { at: [0.14, F + 0.37, bm - 0.07] });
  const oilMark = decal(group, oilIcon(), 0.08, 0.08, [0.14, F + 0.391, bm - 0.07], FLAT, { round: true });
  const dipRing = add(new THREE.TorusGeometry(0.035, 0.01, 8, 20), toon(C.oil), group, { at: [-0.22, F + 0.32, bm + 0.18] });
  const dipstick = add(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 8), toon(C.oil), group, { at: [-0.22, F + 0.19, bm + 0.18], ink: null });
  tag('oil', oilCap, oilMark, dipRing, dipstick);

  const bx = -0.34;
  const bz = bz0 + 0.16;
  const battery = add(rbox(0.26, 0.2, 0.18, 0.02), toon(TONE.plastic), group, { at: [bx, F + 0.1, bz] });
  const sticker = decal(group, batteryLabel(), 0.2, 0.1, [bx, F + 0.11, bz + 0.092]);
  const termPos = add(new THREE.CylinderGeometry(0.026, 0.026, 0.05, 12), toon(TONE.brightRed, { shine: 0.5 }), group, { at: [bx - 0.08, F + 0.22, bz - 0.06], ink: null });
  const termNeg = add(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12), M.trim(), group, { at: [bx + 0.08, F + 0.22, bz - 0.06], ink: null });
  const holdDown = add(rbox(0.3, 0.018, 0.03, 0.006), M.trim(), group, { at: [bx, F + 0.209, bz + 0.03], ink: null });
  const cablePos = tube([v(bx - 0.08, F + 0.24, bz - 0.06), v(bx - 0.1, F + 0.28, bz + 0.1), v(-0.4, F + 0.16, bm - 0.06), v(-0.4, F + 0.1, bm - 0.02)], 0.013, toon(TONE.brightRed, { shine: 0.4 }), group);
  const cableNeg = tube([v(bx + 0.08, F + 0.24, bz - 0.06), v(bx + 0.1, F + 0.27, bz + 0.04), v(-0.26, F + 0.18, bm - 0.16)], 0.012, hose(), group);
  tag('battery', battery, sticker, termPos, termNeg, holdDown, cablePos, cableNeg);

  const airbox = add(rbox(0.26, 0.18, 0.24, 0.03), toon(TONE.graphite), group, { at: [0.4, F + 0.09, bz0 + 0.17] });
  const airLid = add(rbox(0.27, 0.04, 0.25, 0.02), toon(TONE.graphite, { shine: 0.3 }), group, { at: [0.4, F + 0.19, bz0 + 0.17] });
  const clips = [-0.08, 0.08].map((dz) => add(rbox(0.02, 0.06, 0.03, 0.006), M.chrome(), group, { at: [0.535, F + 0.17, bz0 + 0.17 + dz], ink: null }));
  const ductPts = [v(0.38, F + 0.2, bz0 + 0.24), v(0.37, F + 0.28, bz0 + 0.3), v(0.3, F + 0.27, plenumZ)];
  const duct = tube(ductPts, 0.04, toon(TONE.graphite, { shine: 0.3 }), group, { radial: 14 });
  const curve = new THREE.CatmullRomCurve3(ductPts);
  const ribs = [0.3, 0.55, 0.8].map((k) => {
    const rib = add(new THREE.TorusGeometry(0.043, 0.006, 6, 18), toon(TONE.graphite), group, { ink: null });
    rib.position.copy(curve.getPointAt(k));
    rib.lookAt(rib.position.clone().add(curve.getTangentAt(k)));
    return rib;
  });
  tag('airbox', airbox, airLid, ...clips, duct, ...ribs);

  // Fill caps sit just under the hood line, where you'd actually find them, so they show from above.
  const tankZ = bm + 0.31;
  const coolant = add(rbox(0.15, 0.2, 0.16, 0.03), toon(C.coolant, { shine: 0.5 }), group, { at: [0.43, F + 0.22, tankZ] });
  const coolMat = coolant.material as THREE.MeshToonMaterial;
  coolMat.transparent = true;
  coolMat.opacity = 0.62;
  coolMat.depthWrite = false;
  const fluid = add(rbox(0.13, 0.12, 0.14, 0.02), toon(C.coolantCap, { halftone: 0.3 }), group, { at: [0.43, F + 0.18, tankZ], ink: null });
  const marks = [F + 0.15, F + 0.27].map((y) => add(rbox(0.06, 0.008, 0.004, 0.002), M.trim(), group, { at: [0.43, y, tankZ + 0.081], ink: null }));
  const coolantCap = add(new THREE.CylinderGeometry(0.042, 0.042, 0.035, 18), toon(C.coolantCap, { shine: 0.5 }), group, { at: [0.43, F + 0.337, tankZ] });
  tag('coolant', coolant, fluid, ...marks, coolantCap);

  const washer = add(rbox(0.15, 0.2, 0.16, 0.03), toon(C.washer, { shine: 0.5 }), group, { at: [-0.43, F + 0.22, tankZ] });
  const washerCap = add(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 18), toon(C.washerCap, { shine: 0.4 }), group, { at: [-0.43, F + 0.337, tankZ] });
  const washerMark = decal(group, washerIcon(), 0.08, 0.08, [-0.43, F + 0.356, tankZ], FLAT, { round: true });
  tag('washer', washer, washerCap, washerMark);

  const fuseEngine = add(rbox(0.2, 0.1, 0.15, 0.02), toon(C.darkPart), group, { at: [-0.38, F + 0.05, bm + 0.05] });
  const fuseLid = add(rbox(0.21, 0.03, 0.16, 0.012), M.frame(), group, { at: [-0.38, F + 0.11, bm + 0.05] });
  const fuseTag = decal(group, fuseLabel(), 0.14, 0.07, [-0.38, F + 0.126, bm + 0.05], FLAT);
  tag('fusebox_engine', fuseEngine, fuseLid, fuseTag);

  // Untagged plumbing: the radiator across the nose, its hose to the thermostat, heater hoses into the firewall.
  const radZ = bz1 - 0.035;
  add(rbox(0.9, 0.3, 0.05, 0.01), textured(radiatorTex(), { shine: 0.3, metal: 0.3 }), group, { at: [0, F + 0.17, radZ] });
  add(rbox(1.0, 0.04, 0.08, 0.012), toon(C.trim, { halftone: 0.5 }), group, { at: [0, F + 0.34, radZ] });
  // Sits a hair proud of the bar so its top face never z-fights the bar's, whatever order the two draw in.
  add(rbox(0.06, 0.02, 0.04, 0.006), M.chrome(), group, { at: [0, F + 0.351, radZ + 0.01], ink: null });
  tube([v(0.22, F + 0.26, radZ - 0.03), v(0.2, F + 0.31, (radZ + bm) / 2 + 0.05), v(0.16, F + 0.24, bm + 0.21)], 0.022, hose(), group, { radial: 10 });
  for (const x of [-0.02, 0.08]) tube([v(x, F + 0.16, bm - 0.2), v(x, F + 0.2, bm - 0.3), v(x + 0.02, F + 0.24, bz0 + 0.005)], 0.017, hose(), group, { radial: 8 });
  return { F, bz0, bz1, bm, tankZ };
}
