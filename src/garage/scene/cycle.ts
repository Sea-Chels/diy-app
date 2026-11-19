import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { V3 } from '../../shared/scene/kit';
import type { View } from '../../shared/scene/stage';
import type { LidId, PartId } from '../data/parts';
import { tweenScope } from '../../shared/tween';
import { createPartBeacons, createPivotLids, createParts, shareMaterials, viewInParent, viewsInParent, type LidSpec, type RideRig } from './parts3d';

/**
 * Geometry the motorcycle and bike share. Both are built facing +z with the wheels on the
 * x = 0 plane, so +x is the rider's left.
 */

const UP = new THREE.Vector3(0, 1, 0);

/** A round rod from a to b, baked into the geometry so its ink hull follows it. */
export function rod(a: V3, b: V3, r: number, radial = 12): THREE.BufferGeometry {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(r, r, va.distanceTo(vb), radial);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, vb.clone().sub(va).normalize());
  return g.applyQuaternion(q).translate((va.x + vb.x) / 2, (va.y + vb.y) / 2, (va.z + vb.z) / 2);
}

/** A rounded tube along a smooth path through `pts`. */
export const pipe = (pts: V3[], r: number, closed = false, seg = pts.length * 8) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), seg, r, 8, closed);

/** A coil spring wound around the line from a to b. */
export function coil(a: V3, b: V3, radius: number, wire: number, turns: number): THREE.BufferGeometry {
  const va = new THREE.Vector3(...a);
  const axis = new THREE.Vector3(...b).sub(va);
  const u = new THREE.Vector3(1, 0, 0);
  const w = new THREE.Vector3().crossVectors(axis, u).normalize();
  const pts: V3[] = [];
  const n = turns * 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ang = t * turns * Math.PI * 2;
    const p = va.clone().addScaledVector(axis, t).addScaledVector(u, Math.cos(ang) * radius).addScaledVector(w, Math.sin(ang) * radius);
    pts.push([p.x, p.y, p.z]);
  }
  return pipe(pts, wire, false, n * 2);
}

/** Turns a cylinder or torus built round y (or z) to spin round the axle (x). */
export const onAxle = (g: THREE.BufferGeometry, from: 'y' | 'z' = 'y') => (from === 'y' ? g.rotateZ(Math.PI / 2) : g.rotateY(Math.PI / 2));

/** A round-section tire of outer radius `R` and width `2 * tube`. */
export const tire = (R: number, tube: number) => onAxle(new THREE.TorusGeometry(R - tube, tube, 14, 48), 'z');

/** Straight spokes from a hub flange out to the rim, alternating sides, as one mesh. */
export function spokes(n: number, hubR: number, flange: number, rimR: number, r: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // Tangential lacing: each spoke leaves the hub a little ahead of where it meets the rim.
    const h = a + (i % 2 ? 0.5 : -0.5);
    const x = i % 2 ? flange : -flange;
    parts.push(rod([x, Math.sin(h) * hubR, Math.cos(h) * hubR], [0, Math.sin(a) * rimR, Math.cos(a) * rimR], r, 4));
  }
  return mergeGeometries(parts);
}

/** A pulley the chain wraps: center (z, y), radius, and 1 if the chain turns round it from +z toward +y, -1 the other way. */
export interface Pulley {
  c: [number, number];
  r: number;
  wrap: 1 | -1;
}

/**
 * The closed path of a chain around pulleys in the order it meets them, in the plane x.
 * Same-direction neighbors are joined by an outer tangent, opposite ones (a derailleur's S-bend) by a crossing one.
 */
export function chainPath(pulleys: Pulley[], x: number, step = 0.012): V3[] {
  const n = pulleys.length;
  const legs: { from: [number, number]; to: [number, number] }[] = [];
  for (let i = 0; i < n; i++) {
    const A = pulleys[i];
    const B = pulleys[(i + 1) % n];
    const dz = B.c[0] - A.c[0];
    const dy = B.c[1] - A.c[1];
    const L = Math.hypot(dz, dy);
    const [uz, uy] = [dz / L, dy / L];
    const ra = A.wrap * A.r;
    const rb = B.wrap * B.r;
    const a = (ra - rb) / L;
    if (!(Math.abs(a) < 1)) throw new Error(`chainPath: pulleys ${i} and ${(i + 1) % n} overlap, so no chain run joins them`);
    const b0 = Math.sqrt(Math.max(0, 1 - a * a));
    for (const b of [b0, -b0]) {
      const nz = a * uz - b * uy;
      const ny = a * uy + b * uz;
      const p1: [number, number] = [A.c[0] + ra * nz, A.c[1] + ra * ny];
      const p2: [number, number] = [B.c[0] + rb * nz, B.c[1] + rb * ny];
      // The chain runs along the tangent in the direction its wrap carries it: perp(n) = (-ny, nz).
      if ((p2[0] - p1[0]) * -ny + (p2[1] - p1[1]) * nz > 0) {
        legs.push({ from: p1, to: p2 });
        break;
      }
    }
  }
  const pts: V3[] = [];
  const line = (p: [number, number], q: [number, number]) => {
    const k = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
    for (let j = 0; j < k; j++) pts.push([x, p[1] + ((q[1] - p[1]) * j) / k, p[0] + ((q[0] - p[0]) * j) / k]);
  };
  for (let i = 0; i < n; i++) {
    line(legs[i].from, legs[i].to);
    const P = pulleys[(i + 1) % n];
    const angle = (q: [number, number]) => Math.atan2(q[1] - P.c[1], q[0] - P.c[0]);
    const a0 = angle(legs[i].to);
    let a1 = angle(legs[(i + 1) % n].from);
    if (P.wrap > 0) while (a1 <= a0) a1 += Math.PI * 2;
    else while (a1 >= a0) a1 -= Math.PI * 2;
    const k = Math.max(2, Math.ceil((Math.abs(a1 - a0) * P.r) / step));
    for (let j = 0; j < k; j++) {
      const t = a0 + ((a1 - a0) * j) / k;
      pts.push([x, P.c[1] + Math.sin(t) * P.r, P.c[0] + Math.cos(t) * P.r]);
    }
  }
  return pts;
}

/** A chain as a closed tube along `chainPath`. */
export function chain(pulleys: Pulley[], x: number, r: number): THREE.BufferGeometry {
  const pts = chainPath(pulleys, x).map((p) => new THREE.Vector3(...p));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), pts.length, r, 6, true);
}

/**
 * The frame a two-wheeler is built in: `body` leans by `lean` inside `group`, as on its stand.
 * `finish` adds the lids, dots and views, all given in that leaning frame.
 */
export function createCycle(lean: number) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.rotation.z = lean;
  group.add(body);
  const { hotspots, tag } = createParts();
  const tweens = tweenScope();
  /** Height above `body`'s origin at which a stand foot `x` out from the wheels meets the ground. */
  const groundY = (x: number) => x * Math.tan(-lean);
  const finish = <P extends PartId>(
    spec: { lids?: Partial<Record<LidId, LidSpec>>; dots: Record<P, V3>; views: Record<P, View>; overview: View },
  ): RideRig<P> => {
    const { setLid, canPick } = createPivotLids(spec.lids ?? {}, tweens);
    shareMaterials(group, hotspots);
    const { beacons, beaconAt } = createPartBeacons(body, canPick);
    for (const p of Object.keys(spec.dots) as P[]) beaconAt(p, spec.dots[p]);
    return {
      group,
      hotspots,
      beacons,
      views: viewsInParent(spec.views, body),
      overview: viewInParent(spec.overview, body),
      setLid,
      canPick,
      poke: () => {},
      stop: tweens.stop,
    };
  };
  return { body, tag, groundY, finish };
}
