import * as THREE from 'three';
import { toon } from '../../shared/toon';
import type { BodyKind } from '../data/paint';
import { curve, ringPoint, tAtY, type SectionFn } from './loft';
import { SPECS } from './specs';
import { rbox } from './kit';
import { createParts } from './parts3d';

/** Everything the car's zones share: the body's spec, its profile curves and the mesh helpers. */
export function createCtx(kind: BodyKind) {
  const S = SPECS[kind];
  const group = new THREE.Group();
  const { hotspots, tag } = createParts();
  const paintMats: THREE.MeshToonMaterial[] = [];

  // The rig paints every body panel before the first frame, so the starting color never shows.
  const paint = () => {
    const m = toon(0xffffff);
    paintMats.push(m);
    return m;
  };

  const lowerTop = curve(S.lowerTop);
  const lowerBottom = curve(S.lowerBottom);
  const lowerWidth = curve(S.lowerWidth);
  const hoodLine = curve(S.hood);
  const fasciaTop = curve(S.fasciaTop);
  const fasciaBottom = curve(S.fasciaBottom);
  const fasciaWidth = curve(S.fasciaWidth);
  const roofLine = curve(S.roof);
  const archR = S.wheelR + 0.08;
  const arch = (z: number, wz: number) => {
    const d = z - wz;
    return Math.abs(d) < archR ? S.wheelR + Math.sqrt(archR * archR - d * d) : -Infinity;
  };

  const LOWER_N = 6;
  const lower: SectionFn = (z) => {
    const w = lowerWidth(z);
    return { z, yt: lowerTop(z), yb: Math.max(lowerBottom(z), arch(z, S.wheelZ[1])), wb: w, wt: w - 0.04 };
  };
  const fenderW = 0.17;
  /** Where the hood lid ends and the closed nose begins. */
  const hoodZ1 = S.fasciaZ + 0.02;
  /** Half width of the hood lid; the front skin's top opening matches it. */
  const hoodW = S.halfW - fenderW + 0.01;
  /**
   * The whole front end, cowl to nose, as one section: full width under the hood line, then the
   * nose curves. Same superellipse as the cabin tub, so the two meet without a seam.
   */
  const front: SectionFn = (z) => {
    if (z < S.fasciaZ) return { z, yt: hoodLine(z), yb: Math.max(S.bottom, arch(z, S.wheelZ[0])), wb: S.halfW, wt: S.halfW - 0.04 };
    const w = fasciaWidth(z);
    return { z, yt: fasciaTop(z), yb: fasciaBottom(z), wb: w, wt: w - 0.04 };
  };
  /** Ring t on the +x side where the front skin's top edge meets the hood's edge. */
  const hoodEdgeT = (() => {
    const s = front((S.cowlZ + S.fasciaZ) / 2);
    let t = 0.25;
    while (t > 0 && ringPoint(s, t, LOWER_N).x < hoodW + 0.004) t -= 0.0005;
    return t;
  })();
  /** Solid inner fender tops either side of the bay, tucked just under the skin; they read as the shelf beside the open hood. */
  const fender = (side: number): SectionFn => (z) => ({
    z,
    x: side * (S.halfW - fenderW - 0.03),
    yt: hoodLine(z) - 0.012,
    yb: Math.max(S.bottom, arch(z, S.wheelZ[0])),
    wb: fenderW - 0.04,
    wt: fenderW - 0.06,
  });
  /** Half width of the nose at height y (0 above or below it). */
  const noseHalfX = (z: number, y: number) => {
    const s = front(z);
    const v = (y - s.yb) / (s.yt - s.yb);
    if (v < 0 || v > 1) return 0;
    const ey = Math.abs(2 * v - 1);
    return (s.wb + (s.wt - s.wb) * v) * (1 - ey ** LOWER_N) ** (1 / LOWER_N);
  };
  /** The most forward z where the nose surface passes through (x, y). */
  const noseZAt = (x: number, y: number) => {
    for (let z = S.noseZ; z > S.fasciaZ; z -= 0.003) if (noseHalfX(z, y) >= Math.abs(x)) return z;
    return S.fasciaZ;
  };
  /** Height of the nose's top surface at (x, z). */
  const noseTopY = (x: number, z: number) => {
    const s = front(z);
    for (let y = s.yt; y > s.yb; y -= 0.002) if (noseHalfX(z, y) >= Math.abs(x)) return y;
    return s.yb;
  };
  /** A spot on the nose's front at (x, y): its position lifted off the skin, and the yaw/pitch that face outward there. */
  const onNose = (x: number, y: number, lift: number) => {
    const e = 0.01;
    const z = noseZAt(x, y);
    const yaw = Math.atan2(-(noseZAt(x + e, y) - noseZAt(x - e, y)) / (2 * e), 1);
    const pitch = Math.atan((noseZAt(x, y + e) - noseZAt(x, y - e)) / (2 * e));
    return { pos: [x + Math.sin(yaw) * lift, y, z + Math.cos(yaw) * lift] as [number, number, number], yaw, pitch };
  };
  const GH_N = 4;
  const TUB_T = 0.108; // ring t where the cabin tub's open top starts on the +x side
  // The glass stands straight up off the door tops: only the upper half of the
  // ring is used, and its widest point (t = 0) sits on the tub's top edge.
  const sill = ringPoint(lower(S.seatZ), TUB_T, LOWER_N);
  const ghBaseY = sill.y - 0.012;
  const ghBaseW = sill.x - 0.025;
  const gh: SectionFn = (z) => {
    const yt = Math.max(roofLine(z), ghBaseY + 0.004);
    return { z, yb: 2 * ghBaseY - yt, yt, wb: 2 * ghBaseW - S.ghW[1], wt: S.ghW[1] };
  };

  /** Ring t of the glasshouse's upper corner on the +x side; the side glass is t below it, the roof above. */
  const GH_CORNER_T = 0.125;
  /** Black trim along the foot of the side glass, between z0 and z1, wide enough to cap the door top and reach in to the glass. */
  const beltTrim = (side: number, z0: number, z1: number) => rbox(0.064, 0.022, z1 - z0, 0.008).translate(side * (sill.x + 0.003), ghBaseY + 0.008, (z0 + z1) / 2);

  /** Height of the glasshouse (roof) surface at (x, z); it falls away from the center line toward the edges. */
  const roofY = (x: number, z: number) => {
    const s = gh(z);
    let t = 0.25;
    while (t > GH_CORNER_T && ringPoint(s, t, GH_N).x < Math.abs(x)) t -= 0.0005;
    return ringPoint(s, t, GH_N).y;
  };

  /** x of the body surface at height y, on the given side, lifted off it by `lift`. */
  const sideX = (z: number, y: number, side: number, lift: number) => {
    const s = lower(z);
    const t = tAtY(s, y, LOWER_N);
    return ringPoint(s, side > 0 ? t : 0.5 - t, LOWER_N).x + side * lift;
  };

  return {
    S, kind, group, hotspots, paintMats, paint, tag,
    lowerTop, lowerBottom, lowerWidth, hoodLine, fasciaBottom, fasciaWidth, roofLine,
    archR, LOWER_N, lower, fenderW, hoodW, hoodZ1, fender, front, hoodEdgeT, noseTopY, onNose, GH_N, TUB_T, sill, ghBaseY, gh, GH_CORNER_T, beltTrim, roofY, sideX,
  };
}

export type CarCtx = ReturnType<typeof createCtx>;
