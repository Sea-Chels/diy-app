import * as THREE from 'three';
import { outline, toon, type InkWeight } from '../../shared/toon';
import type { V3 } from '../../shared/scene/kit';
import type { PartId } from '../data/parts';
import type { BodyKind } from '../data/paint';
import { curve, ringPoint, tAtY, type SectionFn } from './loft';
import { SPECS } from './specs';
import { C } from './kit';

/** Everything the car's zones share: the body's spec, its profile curves and the mesh helpers. */
export function createCtx(kind: BodyKind) {
  const S = SPECS[kind];
  const group = new THREE.Group();
  const hotspots = new Map<PartId, THREE.Mesh[]>();
  const paintMats: THREE.MeshToonMaterial[] = [];

  // The rig paints every body panel before the first frame, so the starting colour never shows.
  const paint = () => {
    const m = toon(0xffffff);
    paintMats.push(m);
    return m;
  };
  const chromeMat = () => toon(C.chrome, { shine: 1, metal: 0.9 });

  /** Create a mesh, add it to `parent`, ink it. Each mesh gets its own material so highlights stay local. */
  const put = (parent: THREE.Object3D, geom: THREE.BufferGeometry, mat: THREE.Material, pos?: V3, ink: InkWeight | false = 'body'): THREE.Mesh => {
    const m = new THREE.Mesh(geom, mat);
    if (pos) m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    if (ink) outline(m, ink);
    parent.add(m);
    return m;
  };

  const tag = (part: PartId, ...meshes: THREE.Mesh[]) => {
    const list = hotspots.get(part) ?? [];
    for (const m of meshes) {
      m.userData.area = part;
      list.push(m);
    }
    hotspots.set(part, list);
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
  const fender = (side: number): SectionFn => (z) => ({
    z,
    x: side * (S.halfW - fenderW),
    yt: hoodLine(z) - 0.004,
    yb: Math.max(S.bottom, arch(z, S.wheelZ[0])),
    wb: fenderW,
    wt: fenderW - 0.025,
  });
  const fascia: SectionFn = (z) => {
    const w = fasciaWidth(z);
    return { z, yt: fasciaTop(z), yb: fasciaBottom(z), wb: w, wt: w - 0.06 };
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

  /** x of the body surface at height y, on the given side, lifted off it by `lift`. */
  const sideX = (z: number, y: number, side: number, lift: number) => {
    const s = lower(z);
    const t = tAtY(s, y, LOWER_N);
    return ringPoint(s, side > 0 ? t : 0.5 - t, LOWER_N).x + side * lift;
  };

  return {
    S, kind, group, hotspots, paintMats, paint, chromeMat, put, tag,
    lowerTop, lowerBottom, lowerWidth, hoodLine, fasciaTop, fasciaBottom, fasciaWidth, roofLine,
    archR, arch, LOWER_N, lower, fenderW, fender, fascia, GH_N, TUB_T, sill, ghBaseY, ghBaseW, gh, sideX,
  };
}

export type CarCtx = ReturnType<typeof createCtx>;
