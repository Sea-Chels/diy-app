import * as THREE from 'three';
import { glass, toon } from '../../../shared/toon';
import { mapped, type V3 } from '../../../shared/scene/kit';
import { ringPoint, shell, type Section, type SectionFn } from '../loft';
import { C, M, rbox } from '../kit';
import { plateTex } from '../textures';
import type { CarCtx } from '../ctx';

export function buildTrunk(c: CarCtx) {
  const { S, group, paint, put, tag, lowerTop, lowerBottom, lowerWidth, roofLine, LOWER_N, lower, GH_N, sill, ghBaseY } = c;
  let trunkPivot: THREE.Group;
  let trunkOpen: number;
  let trunkBeacon: V3;
  let trunkView: V3;
  const suvTails: THREE.Mesh[] = [];
  let suvLampPos: THREE.Vector3 | null = null;
  if (S.deck) {
    const [dz0, dz1] = S.deck;
    trunkPivot = new THREE.Group();
    const hinge = new THREE.Vector3(0, lowerTop(dz1), dz1);
    trunkPivot.position.copy(hinge);
    group.add(trunkPivot);
    const lidGeom = shell(lower, LOWER_N, dz0, dz1, 0.07, 0.43, 0.006, 0.028, 24, 16);
    lidGeom.translate(-hinge.x, -hinge.y, -hinge.z);
    const lid = put(trunkPivot, lidGeom, paint());
    put(group, shell(lower, LOWER_N, dz0 + 0.04, dz1 - 0.03, 0.09, 0.41, 0.002, 0.002, 12, 10), toon(C.bay, { halftone: 0.5, side: THREE.DoubleSide }), undefined, false);
    const spare = put(group, new THREE.CylinderGeometry(0.24, 0.24, 0.02, 32), M.rubber('matte'), [0.1, lowerTop((dz0 + dz1) / 2) + 0.004, (dz0 + dz1) / 2], 'thin');
    tag('trunk', lid, spare);
    trunkOpen = 1.15;
    trunkBeacon = [0, lowerTop(dz0) + 0.12, (dz0 + dz1) / 2];
    trunkView = [0.5, 0.9, -1];
  } else {
    // SUV rear, modelled on a crossover: the side window line and roof carry
    // straight back into curved body-colour D-pillars, the rear glass is raked
    // forward, and a liftgate cut to the opening's exact outline sits flush in it.
    const cargoY = S.cargoFloorY ?? S.floorY;
    const RAKE = 0.34; // z shift per unit height above the window line
    const yk = ghBaseY;
    const shear = (g: THREE.BufferGeometry) => {
      const pos = g.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + Math.max(0, pos.getY(i) - yk) * RAKE);
      pos.needsUpdate = true;
      g.computeVertexNormals();
      return g;
    };
    const W = sill.x + 0.005; // pillar width at the window line = the body's shoulder
    const RIM = 0.05;
    // The shell stands RIM proud of this section, so its outer top lands flush with the roof panel (0.016 up).
    const rearSec: SectionFn = (z) => {
      const yt = roofLine(Math.max(z, S.ghRearZ)) + 0.016 - RIM;
      const wt = S.ghW[1] + 0.03;
      return { z, yb: 2 * yk - yt, yt, wb: 2 * W - wt, wt };
    };
    const pillarZ0 = S.ghRearZ + 0.04;
    const pillars = shear(shell(rearSec, GH_N, S.tailZ, pillarZ0, -0.02, 0.52, -RIM, RIM, 30, 48));
    put(group, pillars, paint());

    const yTop = rearSec(S.tailZ).yt;
    const outlineAt = (inset: number, yBottom: number): THREE.Shape => {
      const s0 = rearSec(S.tailZ);
      const si: Section = { ...s0, yt: s0.yt - inset, yb: 2 * yk - (s0.yt - inset), wb: s0.wb - inset, wt: s0.wt - inset };
      const sh = new THREE.Shape();
      const hw = W - inset;
      sh.moveTo(-hw + 0.06, yBottom);
      sh.lineTo(hw - 0.06, yBottom);
      sh.quadraticCurveTo(hw, yBottom, hw, yBottom + 0.06);
      for (let i = 0; i <= 32; i++) {
        const p = ringPoint(si, (0.5 * i) / 32, GH_N);
        sh.lineTo(p.x, p.y);
      }
      sh.lineTo(-hw, yBottom + 0.06);
      sh.quadraticCurveTo(-hw, yBottom, -hw + 0.06, yBottom);
      return sh;
    };
    const gateBottom = cargoY - 0.2;
    const GAP = 0.008;

    // liftgate: built in world space, sheared with the body, then moved into the hinge frame
    const hy = yTop - RIM - GAP;
    const hz = S.tailZ + (hy - yk) * RAKE;
    trunkPivot = new THREE.Group();
    trunkPivot.position.set(0, hy, hz);
    group.add(trunkPivot);
    const BT = 0.01;
    const toHinge = (g: THREE.BufferGeometry) => shear(g).translate(0, -hy, -hz);
    const panelGeom = new THREE.ExtrudeGeometry(outlineAt(RIM + GAP + BT, gateBottom + BT), { depth: 0.03, bevelEnabled: true, bevelThickness: BT, bevelSize: BT, bevelSegments: 2, curveSegments: 12 });
    panelGeom.translate(0, 0, S.tailZ + BT);
    const panel = put(trunkPivot, toHinge(panelGeom), paint());
    const glassShape = (() => {
      const sh = outlineAt(RIM + 0.11, yk + 0.12);
      return sh;
    })();
    const glassGeom = new THREE.ShapeGeometry(glassShape, 16);
    glassGeom.translate(0, 0, S.tailZ - 0.004);
    const gateGlass = new THREE.Mesh(toHinge(glassGeom), glass());
    gateGlass.renderOrder = 2;
    trunkPivot.add(gateGlass);
    // fixed to the roof edge, so it stays put when the gate swings up
    const spoiler = put(group, rbox(2 * (S.ghW[1] - 0.06), 0.035, 0.16, 0.017), paint(), [0, hy + RIM + 0.004, hz - 0.03]);
    spoiler.rotation.x = -0.12;
    const local = (x: number, y: number, z: number): V3 => [x, y - hy, z + Math.max(0, y - yk) * RAKE - hz];
    const handle = put(trunkPivot, rbox(0.3, 0.04, 0.03, 0.01), M.chrome(), local(0, yk - 0.05, S.tailZ - 0.014), 'thin');
    put(trunkPivot, rbox(0.34, 0.1, 0.012, 0.01), mapped(0xffffff, plateTex(), { shine: 0.5, halftone: 0.3 }), local(0, yk - 0.2, S.tailZ - 0.008), 'thin');

    // split taillights: one half wraps the body corner, the other rides on the gate
    const lampMat = () => M.lamp(C.taillight, 0.6);
    const lampY = yk + 0.035;
    for (const side of [1, -1]) {
      const body = put(group, rbox(0.03, 0.09, 0.3, 0.014), lampMat(), [side * (W + 0.01), lampY, S.tailZ + 0.17]);
      const corner = put(group, rbox(RIM + 0.02, 0.09, 0.03, 0.012), lampMat(), [side * (W - RIM / 2 + 0.01), lampY, S.tailZ - 0.005 + 0.035 * RAKE]);
      const onGate = put(trunkPivot, rbox(0.3, 0.08, 0.025, 0.012), lampMat(), local(side * (W - RIM - 0.18), lampY, S.tailZ - 0.012));
      suvTails.push(body, corner, onGate);
    }
    suvLampPos = new THREE.Vector3(W, lampY, S.tailZ + 0.05);

    // rear face below the window line: a U-shaped panel that wraps the lower gate
    {
      const L = lowerWidth(S.tailZ) - 0.012;
      const yb0 = lowerBottom(S.tailZ) + 0.05;
      const yT = yk + 0.01;
      const G = W - RIM;
      const gb = gateBottom - GAP;
      const r = 0.12;
      const u = new THREE.Shape();
      u.moveTo(-L + r, yb0);
      u.lineTo(L - r, yb0);
      u.quadraticCurveTo(L, yb0, L, yb0 + r);
      u.lineTo(L, yT);
      u.lineTo(G, yT);
      u.lineTo(G, gb + 0.06);
      u.quadraticCurveTo(G, gb, G - 0.06, gb);
      u.lineTo(-G + 0.06, gb);
      u.quadraticCurveTo(-G, gb, -G, gb + 0.06);
      u.lineTo(-G, yT);
      u.lineTo(-L, yT);
      u.lineTo(-L, yb0 + r);
      u.quadraticCurveTo(-L, yb0, -L + r, yb0);
      const uGeom = new THREE.ExtrudeGeometry(u, { depth: 0.05, bevelEnabled: true, bevelThickness: BT, bevelSize: BT, bevelSegments: 2, curveSegments: 10 });
      uGeom.translate(0, 0, S.tailZ + BT);
      put(group, uGeom, paint());
      put(group, rbox(2 * G - 0.02, cargoY - gb, 0.02, 0.006), toon(C.bay, { halftone: 0.6 }), [0, (cargoY + gb) / 2, S.tailZ + 0.06], false);
    }

    const cargoZ0 = S.tailZ + 0.05;
    const cargoZ1 = (S.rearSeatZ ?? S.seatZ) - 0.2;
    put(group, rbox((S.halfW - 0.1) * 2, 0.03, cargoZ1 - cargoZ0, 0.01), toon(C.bay, { halftone: 0.6 }), [0, cargoY, (cargoZ0 + cargoZ1) / 2], false);
    const spare = put(group, new THREE.CylinderGeometry(0.27, 0.27, 0.1, 32), M.rubber('matte'), [0.15, cargoY + 0.065, (cargoZ0 + cargoZ1) / 2 - 0.1], 'thin');
    const spareHub = put(group, new THREE.CylinderGeometry(0.15, 0.15, 0.104, 24), M.metal(), [0.15, cargoY + 0.066, (cargoZ0 + cargoZ1) / 2 - 0.1], 'thin');
    tag('trunk', panel, handle, spare, spareHub);
    trunkOpen = 1.35;
    trunkBeacon = [0, yk - 0.05, S.tailZ - 0.14];
    trunkView = [0.45, 0.55, -1];
  }
  return { trunkPivot, trunkOpen, trunkBeacon, trunkView, suvTails, suvLampPos };
}
export type Trunk = ReturnType<typeof buildTrunk>;
