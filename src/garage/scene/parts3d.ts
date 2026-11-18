import * as THREE from 'three';
import { outline, type InkWeight } from '../../shared/toon';
import { tween, easeInOutCubic, lerp } from '../../shared/tween';
import type { V3 } from '../../shared/scene/kit';
import type { View } from '../../shared/scene/stage';
import { hex } from '../../shared/theme';
import { PARTS, type LidId, type PartId } from '../data/parts';

/** Mesh helpers every vehicle shares: `put` adds an inked mesh, `tag` makes meshes a part's hotspots. */
export function createParts() {
  const hotspots = new Map<PartId, THREE.Mesh[]>();

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

  return { hotspots, put, tag };
}

/** Glowing dots marking each part, added to `parent`. They hide while their part can't be picked (its lid is shut). */
export function createBeacons(parent: THREE.Object3D, canPick: (part: PartId) => boolean) {
  const beacons = new Map<PartId, THREE.Mesh>();
  const geom = new THREE.SphereGeometry(0.045, 16, 16);
  // Unlike the other workshops' beacons these are depth-tested, so the vehicle hides them and they pick like any other part.
  const beaconAt = (part: PartId, p: V3) => {
    const b = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: hex('cyan'), transparent: true, opacity: 0.92 }));
    b.position.set(...p);
    b.renderOrder = 3;
    b.userData.area = part;
    b.userData.seen = () => canPick(part);
    parent.add(b);
    beacons.set(part, b);
  };
  return { beacons, beaconAt };
}

/** A camera view of `target` from `dist` away along `dir`. */
export const view = (target: V3, dir: V3, dist: number): View => {
  const d = new THREE.Vector3(...dir).normalize().multiplyScalar(dist);
  return { target, pos: [target[0] + d.x, target[1] + d.y, target[2] + d.z] };
};

/** Tints the selected part's own glow, so small dark parts read as selected too. */
export function glowFocus(hotspots: Map<PartId, THREE.Mesh[]>) {
  const lift = new THREE.Color(hex('cyan'));
  const baseGlow = new Map<THREE.MeshToonMaterial, { color: THREE.Color; intensity: number }>();
  return (part: PartId | null): void => {
    for (const [mat, base] of baseGlow) {
      mat.emissive.copy(base.color);
      mat.emissiveIntensity = base.intensity;
    }
    baseGlow.clear();
    for (const m of part ? hotspots.get(part) ?? [] : []) {
      const mat = m.material as THREE.MeshToonMaterial;
      if (!mat.emissive || baseGlow.has(mat)) continue;
      baseGlow.set(mat, { color: mat.emissive.clone(), intensity: mat.emissiveIntensity });
      mat.emissive.lerp(lift, 0.1);
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 1);
    }
  };
}

/** What the garage needs from each vehicle, whatever its parts. The overview is in the vehicle's own frame. */
export interface Ride {
  group: THREE.Group;
  hotspots: Map<PartId, THREE.Mesh[]>;
  beacons: Map<PartId, THREE.Mesh>;
  overview: View;
  /** Ignores lids that belong to another vehicle. */
  setLid(lid: LidId, open: boolean): void;
  canPick(part: PartId): boolean;
  poke(part: PartId): void;
}

/** A vehicle with a camera view, in its own frame, for every one of its parts `P`. */
export interface RideRig<P extends PartId> extends Ride {
  views: Record<P, View>;
}

/** Moves a view from `obj`'s own frame into its parent's. */
export function viewInParent(v: View, obj: THREE.Object3D): View {
  obj.updateMatrix();
  const p = new THREE.Vector3(...v.pos).applyMatrix4(obj.matrix);
  const t = new THREE.Vector3(...v.target).applyMatrix4(obj.matrix);
  return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
}

export function viewsInParent<P extends PartId>(views: Record<P, View>, obj: THREE.Object3D): Record<P, View> {
  const out = {} as Record<P, View>;
  for (const p of Object.keys(views) as P[]) out[p] = viewInParent(views[p], obj);
  return out;
}

export interface LidSpec {
  pivot: THREE.Group;
  axis: 'x' | 'y';
  open: number;
}

/** Hinged panels that swing open for the parts behind them. `key` keeps two vehicles' tweens apart. */
export function createLids(lids: Partial<Record<LidId, LidSpec>>, key: string) {
  const state = new Map<LidId, boolean>();
  const isOpen = (lid: LidId) => state.get(lid) ?? false;
  const setLid = (lid: LidId, open: boolean): void => {
    const spec = lids[lid];
    if (!spec || isOpen(lid) === open) return;
    state.set(lid, open);
    const { pivot, axis, open: angle } = spec;
    const from = pivot.rotation[axis];
    const to = open ? angle : 0;
    tween({
      duration: 750,
      ease: easeInOutCubic,
      tag: `lid:${key}:${lid}`,
      update: (k) => {
        pivot.rotation[axis] = lerp(from, to, k);
      },
    });
  };
  const canPick = (part: PartId) => {
    const { behind, seeThrough } = PARTS[part];
    return !behind || seeThrough === true || isOpen(behind);
  };
  return { setLid, canPick };
}
