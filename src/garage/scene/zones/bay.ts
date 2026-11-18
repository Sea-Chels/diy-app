import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { C, rbox } from '../kit';
import type { CarCtx } from '../ctx';

export function buildEngineBay(c: CarCtx) {
  const { S, group, put, tag, chromeMat } = c;
  const F = S.bayFloor;
  const bz0 = S.cowlZ + 0.06;
  const bz1 = S.fasciaZ - 0.02;
  const bm = (bz0 + bz1) / 2;
  const engine = put(group, rbox(0.6, 0.28, 0.5, 0.04), toon(C.engine, { shine: 0.4, metal: 0.4 }), [0.02, F + 0.14, bm], 'thin');
  const cover = put(group, rbox(0.46, 0.06, 0.36, 0.02), toon(C.cover, { shine: 0.5, metal: 0.4 }), [0.02, F + 0.31, bm], 'thin');
  const pulley = put(group, new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24), chromeMat(), [0.33, F + 0.12, bm + 0.08], 'thin');
  pulley.rotation.z = Math.PI / 2;
  tag('engine', engine, cover, pulley);

  const oilCap = put(group, new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), toon(C.oil, { shine: 0.6 }), [0.14, F + 0.36, bm - 0.07], 'thin');
  const dipRing = put(group, new THREE.TorusGeometry(0.035, 0.01, 8, 20), toon(C.oil), [-0.22, F + 0.3, bm + 0.18], 'thin');
  const dipstick = put(group, new THREE.CylinderGeometry(0.011, 0.011, 0.2, 8), toon(C.oil), [-0.22, F + 0.18, bm + 0.18], false);
  tag('oil', oilCap, dipRing, dipstick);

  const battery = put(group, rbox(0.26, 0.2, 0.18, 0.02), toon(C.battery), [-0.34, F + 0.1, bz0 + 0.16], 'thin');
  const termPos = put(group, new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12), toon(C.positive), [-0.42, F + 0.22, bz0 + 0.1], false);
  const termNeg = put(group, new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12), toon(C.trim), [-0.26, F + 0.22, bz0 + 0.1], false);
  tag('battery', battery, termPos, termNeg);

  const airbox = put(group, rbox(0.26, 0.18, 0.24, 0.03), toon(C.airbox), [0.36, F + 0.09, bz0 + 0.18], 'thin');
  const intake = put(group, new THREE.CylinderGeometry(0.05, 0.05, 0.26, 16), toon(C.airbox), [0.3, F + 0.16, bz0 + 0.42], 'thin');
  intake.rotation.x = Math.PI / 2;
  tag('airbox', airbox, intake);

  const coolant = put(group, rbox(0.15, 0.2, 0.16, 0.03), toon(C.coolant, { shine: 0.5 }), [0.37, F + 0.1, bz1 - 0.12], 'thin');
  const coolantCap = put(group, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), toon(C.coolantCap), [0.37, F + 0.215, bz1 - 0.12], false);
  tag('coolant', coolant, coolantCap);

  const washer = put(group, rbox(0.14, 0.18, 0.16, 0.03), toon(C.washer, { shine: 0.5 }), [-0.37, F + 0.09, bz1 - 0.12], 'thin');
  const washerCap = put(group, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), toon(C.washerCap), [-0.37, F + 0.195, bz1 - 0.12], false);
  tag('washer', washer, washerCap);

  const fuseEngine = put(group, rbox(0.2, 0.1, 0.15, 0.02), toon(C.fuse), [-0.36, F + 0.05, bm + 0.05], 'thin');
  tag('fusebox_engine', fuseEngine);
  return { F, bz0, bz1, bm };
}
