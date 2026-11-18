import * as THREE from 'three';
import { glass, toon } from '../../../shared/toon';
import { loft, ringPoint, sheet, shell } from '../loft';
import { C, rbox } from '../kit';
import type { CarCtx } from '../ctx';

export function buildBody(c: CarCtx) {
  const { S, group, paint, put, hoodLine, roofLine, archR, LOWER_N, lower, fenderW, fender, fascia, GH_N, TUB_T, gh } = c;
  // Solid behind the cabin on the sedan (the trunk); everything else is an
  // open-topped tub with real wall thickness so the seats sit down inside it.
  const tubZ0 = S.suv ? S.tailZ : S.ghRearZ;
  if (!S.suv) put(group, loft(lower, S.tailZ, S.ghRearZ, LOWER_N, 60), paint());
  const WALL = 0.045;
  put(group, shell(lower, LOWER_N, tubZ0, S.cowlZ, 0.5 - TUB_T, 1 + TUB_T, -WALL, WALL, 110, 44), paint());
  const interior = () => toon(C.bay, { halftone: 0.6, side: THREE.DoubleSide });
  put(group, shell(lower, LOWER_N, tubZ0 + 0.01, S.cowlZ - 0.01, 0.5 - TUB_T + 0.004, 1 + TUB_T - 0.004, -WALL - 0.004, 0.002, 60, 30), interior(), undefined, false);
  const floorHalf = S.halfW - 0.1;
  const floorZ0 = -0.96;
  put(group, rbox(floorHalf * 2, 0.03, S.cowlZ - 0.02 - floorZ0, 0.01), interior(), [0, S.floorY, (S.cowlZ - 0.02 + floorZ0) / 2], false);
  put(group, rbox(floorHalf * 2, S.belt - 0.04 - S.floorY, 0.02, 0.01), interior(), [0, (S.belt - 0.04 + S.floorY) / 2, S.cowlZ - 0.015], false);
  put(group, loft(fender(1), S.cowlZ - 0.04, S.fasciaZ + 0.06, LOWER_N, 70), paint());
  put(group, loft(fender(-1), S.cowlZ - 0.04, S.fasciaZ + 0.06, LOWER_N, 70), paint());
  put(group, loft(fascia, S.fasciaZ, S.noseZ, 5, 30), paint());

  const bayHalf = S.halfW - 2 * fenderW + 0.02;
  put(group, loft((z) => ({ z, yb: S.bottom + 0.02, yt: S.bayFloor, wb: bayHalf, wt: bayHalf }), S.cowlZ - 0.02, S.fasciaZ + 0.02, 8, 8), toon(C.bay, { halftone: 0.4 }), undefined, false);
  put(group, rbox(bayHalf * 2, hoodLine(S.cowlZ) - S.bayFloor, 0.02, 0.005), toon(C.bay, { halftone: 0.4 }), [0, (hoodLine(S.cowlZ) + S.bayFloor) / 2, S.cowlZ + 0.005], false);

  const ghMesh = new THREE.Mesh(sheet(gh, GH_N, S.ghRearZ, S.cowlZ + 0.02, -0.015, 0.515, 90, 40), glass());
  ghMesh.renderOrder = 2;
  group.add(ghMesh);

  const [rz0, rz1] = S.roofPanel;
  const roofTaper = (z: number) => {
    const k = Math.min((z - rz0) / 0.12, (rz1 - z) / 0.12, 1);
    return 0.93 + 0.07 * Math.sin((Math.max(k, 0) * Math.PI) / 2);
  };
  const roofEase = (z: number) => Math.sin((Math.max(Math.min((z - rz0) / 0.16, (rz1 - z) / 0.16, 1), 0) * Math.PI) / 2);
  put(group, loft((z) => {
    const y = roofLine(z);
    const w = (S.ghW[1] + 0.05) * roofTaper(z);
    return { z, yb: y - 0.03, yt: y + 0.01 + 0.038 * roofEase(z), wb: w, wt: w - 0.02 };
  }, rz0, rz1, 8, 50), paint());

  const pillarR = 0.032;
  const tube = (pts: THREE.Vector3[]) => {
    const m = put(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, pillarR, 8, false), paint(), undefined, 'thin');
    // cap the open ends so the ink hull never shows through
    for (const p of [pts[0], pts[pts.length - 1]]) put(group, new THREE.SphereGeometry(pillarR, 10, 8), paint(), [p.x, p.y, p.z], false);
    return m;
  };
  const corner = (side: number, z0: number, z1: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const z = z0 + ((z1 - z0) * i) / 14;
      pts.push(ringPoint(gh(z), side > 0 ? 0.125 : 0.375, GH_N));
    }
    return pts;
  };
  for (const side of [1, -1]) {
    tube(corner(side, S.aPillar[0], S.aPillar[1]));
    for (const [a, b] of S.cornerPillars) tube(corner(side, a, b));
    for (const z of S.vertPillars) {
      const s = gh(z);
      const t0 = -0.01;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = t0 + ((0.125 - t0) * i) / 10;
        pts.push(ringPoint(s, side > 0 ? t : 0.5 - t, GH_N));
      }
      tube(pts);
    }
  }

  if (S.suv) {
    for (const side of [1, -1]) {
      const x = side * (S.ghW[1] - 0.08);
      const pts = [-1.85, -1.2, -0.5, -0.1].map((z) => new THREE.Vector3(x, roofLine(z) + 0.075, z));
      put(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.022, 8, false), toon(C.trim), undefined, 'thin');
      for (const z of [-1.85, -0.1]) put(group, rbox(0.05, 0.07, 0.08, 0.015), toon(C.trim), [x, roofLine(z) + 0.04, z], 'thin');
      const len = S.wheelZ[0] - S.wheelZ[1] - 2 * archR - 0.05;
      put(group, rbox(0.05, 0.13, len, 0.02), toon(C.trim, { halftone: 0.6 }), [side * (S.halfW - 0.01), S.bottom + 0.07, (S.wheelZ[0] + S.wheelZ[1]) / 2 - 0.25], 'thin');
    }
  }
}
