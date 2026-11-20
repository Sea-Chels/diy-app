import * as THREE from 'three';
import { glass, toon } from '../../../shared/toon';
import { loft, sheet, shell } from '../loft';
import { C, M, rbox } from '../kit';
import type { CarCtx } from '../ctx';
import { add } from '../../../shared/scene/kit';
import { TONE } from '../../../shared/theme';

export function buildBody(c: CarCtx) {
  const { S, group, paint, hoodLine, roofLine, archR, LOWER_N, lower, fenderW, fender, front, hoodEdgeT, hoodZ1, GH_N, TUB_T, gh, GH_CORNER_T, beltTrim, roofY } = c;
  // Solid behind the cabin on the sedan (the trunk); everything else is an
  // open-topped tub with real wall thickness so the seats sit down inside it.
  const tubZ0 = S.suv ? S.tailZ : S.ghRearZ;
  if (!S.suv) add(loft(lower, S.tailZ, S.ghRearZ, LOWER_N, 60), paint(), group, { ink: 'body' });
  const WALL = 0.045;
  add(shell(lower, LOWER_N, tubZ0, S.cowlZ, 0.5 - TUB_T, 1 + TUB_T, -WALL, WALL, 110, 44), paint(), group, { ink: 'body' });
  const interior = () => toon(TONE.blackPart, { halftone: 0.6, side: THREE.DoubleSide });
  add(shell(lower, LOWER_N, tubZ0 + 0.01, S.cowlZ - 0.01, 0.5 - TUB_T + 0.004, 1 + TUB_T - 0.004, -WALL - 0.004, 0.002, 60, 30), interior(), group, { ink: null });
  const floorHalf = S.halfW - 0.1;
  const floorZ0 = -0.96;
  add(rbox(floorHalf * 2, 0.03, S.cowlZ - 0.02 - floorZ0, 0.01), interior(), group, { at: [0, S.floorY, (S.cowlZ - 0.02 + floorZ0) / 2], ink: null });
  if (!S.suv && S.rearSeatZ !== null) {
    const shelf0 = S.ghRearZ + 0.02;
    const shelf1 = S.rearSeatZ - 0.3;
    add(rbox(floorHalf * 2, 0.03, shelf1 - shelf0, 0.01), interior(), group, { at: [0, S.belt - 0.02, (shelf0 + shelf1) / 2], ink: null });
  }
  add(rbox(floorHalf * 2, S.belt - 0.04 - S.floorY, 0.02, 0.01), interior(), group, { at: [0, (S.belt - 0.04 + S.floorY) / 2, S.cowlZ - 0.015], ink: null });
  // One skin for the whole front end: side panels up to the hood's edge, then the closed nose.
  for (const [t0, t1] of [[-0.2, hoodEdgeT], [0.5 - hoodEdgeT, 0.7]]) add(shell(front, LOWER_N, S.cowlZ, hoodZ1, t0, t1, -WALL, WALL, 90, 30), paint(), group, { ink: 'body' });
  add(loft(front, hoodZ1, S.noseZ, LOWER_N, 50), paint(), group, { ink: 'body' });
  for (const side of [1, -1]) add(loft(fender(side), S.cowlZ, hoodZ1, LOWER_N, 60), paint(), group, { ink: null });

  const bayHalf = S.halfW - 2 * fenderW + 0.02;
  add(loft((z) => ({ z, yb: S.bottom + 0.02, yt: S.bayFloor, wb: bayHalf, wt: bayHalf }), S.cowlZ - 0.02, S.fasciaZ + 0.02, 8, 8), toon(TONE.blackPart, { halftone: 0.4 }), group, { ink: null });
  add(rbox(bayHalf * 2, hoodLine(S.cowlZ) - S.bayFloor, 0.02, 0.005), toon(TONE.blackPart, { halftone: 0.4 }), group, { at: [0, (hoodLine(S.cowlZ) + S.bayFloor) / 2, S.cowlZ + 0.005], ink: null });

  // The driver's door glass is left out here; it rides on the door (door.ts).
  const [dz0, dz1] = S.door;
  const pane = (z0: number, z1: number, t0: number, t1: number, nz: number, nt: number) => {
    const m = new THREE.Mesh(sheet(gh, GH_N, z0, z1, t0, t1, nz, nt), glass());
    m.renderOrder = 2;
    group.add(m);
  };
  pane(S.ghRearZ, S.cowlZ + 0.02, GH_CORNER_T, 0.515, 90, 34);
  pane(S.ghRearZ, dz0, -0.015, GH_CORNER_T, 50, 8);
  pane(dz1, S.cowlZ + 0.02, -0.015, GH_CORNER_T, 8, 8);

  // Pillars and roof are thin panels laid on the glasshouse itself, so they follow its curve.
  // The SUV's are black, for the floating-roof look; the sedan's are body color.
  const pillarMat = () => (S.suv ? M.trim() : paint());
  const band = (z0: number, z1: number, t0: number, t1: number, side: number, mat = pillarMat()) => {
    const [a, b] = side > 0 ? [t0, t1] : [0.5 - t1, 0.5 - t0];
    return add(shell(gh, GH_N, z0, z1, a, b, 0.002, 0.014, 30, 8), mat, group);
  };
  const [rz0, rz1] = S.roofPanel;
  band(rz0, rz1, GH_CORNER_T - 0.02, 0.5 - GH_CORNER_T + 0.02, 1, paint());
  for (const side of [1, -1]) {
    band(S.aPillar[0], S.aPillar[1] + 0.02, GH_CORNER_T - 0.022, GH_CORNER_T + 0.022, side);
    for (const [a, b] of S.cornerPillars) band(a, b, GH_CORNER_T - 0.03, GH_CORNER_T + 0.03, side);
    for (const z of S.vertPillars) band(z - 0.035, z + 0.035, -0.015, GH_CORNER_T, side);
    if (!S.suv) band(S.ghRearZ, S.ghRearZ + 0.26, -0.015, GH_CORNER_T, side);
    const trim = M.trim();
    const runs: [number, number][] = side > 0 ? [[S.ghRearZ + 0.02, dz0], [dz1, S.cowlZ - 0.02]] : [[S.ghRearZ + 0.02, S.cowlZ - 0.02]];
    for (const [z0, z1] of runs) add(beltTrim(side, z0, z1), trim, group);
  }
  const finZ = rz0 + 0.12;
  // Seated on the roof panel, whose top is 0.016 above the glasshouse.
  add(rbox(0.045, 0.06, 0.15, 0.022), toon(C.trim, { shine: 0.4 }), group, { at: [0, roofLine(finZ) + 0.04, finZ] });

  if (S.suv) {
    for (const side of [1, -1]) {
      // Rails ride a fixed height above the roof where they actually sit, out toward its edge; the feet stand on the panel.
      const x = side * (S.ghW[1] - 0.08);
      const skin = (z: number) => roofY(x, z) + 0.016;
      const RISE = 0.06;
      const pts = [-1.85, -1.4, -0.9, -0.4, -0.1].map((z) => new THREE.Vector3(x, skin(z) + RISE, z));
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.02, 8, false), M.trim(), group);
      for (const z of [-1.85, -0.1]) add(rbox(0.05, RISE + 0.02, 0.1, 0.015), M.trim(), group, { at: [x, skin(z) + RISE / 2, z] });
      if (side > 0) for (const z of [-0.45, -1.45]) add(rbox(2 * x, 0.02, 0.05, 0.008), M.trim(), group, { at: [0, skin(z) + RISE + 0.012, z] });
      const len = S.wheelZ[0] - S.wheelZ[1] - 2 * archR - 0.05;
      add(rbox(0.05, 0.13, len, 0.02), toon(C.trim, { halftone: 0.6 }), group, { at: [side * (S.halfW - 0.01), S.bottom + 0.07, (S.wheelZ[0] + S.wheelZ[1]) / 2 - 0.25] });
    }
  }
}
