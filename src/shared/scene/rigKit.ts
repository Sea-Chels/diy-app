import * as THREE from 'three';
import { hex } from '../theme';
import { tween, easeInOutCubic, lerp } from '../tween';
import { UNIT_BOX, type V3 } from './kit';
import type { View } from './stage';
import { spotOf, tag, tagOf } from './sceneTags';

/** A camera view of `target` from `dist` away along `dir`, scaled by `scale` for rigs modelled in other units. */
export function viewFrom(target: V3, dir: V3, dist: number, scale = 1): View {
  const t = new THREE.Vector3(...target);
  const p = t.clone().addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
  return { target: [t.x * scale, t.y * scale, t.z * scale], pos: [p.x * scale, p.y * scale, p.z * scale] };
}

/**
 * Spots modelled as groups under `root`. Each gets invisible pick boxes, so a click
 * anywhere near it selects it, not just on its meshes.
 */
export function createSpots<S extends string>(root: THREE.Object3D) {
  const groups = new Map<S, THREE.Group>();
  const picks: THREE.Mesh[] = [];
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const spot = (id: S): THREE.Group => {
    const g = new THREE.Group();
    tag(g, 'spot', id);
    root.add(g);
    groups.set(id, g);
    return g;
  };
  /** A pick box of `size` centred on `at`, in `g`'s frame. */
  const pick = (g: THREE.Group, size: V3, at: V3): void => {
    const m = new THREE.Mesh(UNIT_BOX, pickMat);
    m.scale.set(...size);
    m.position.set(...at);
    tag(m, 'spot', spotOf<S>(g) as S);
    g.add(m);
    picks.push(m);
  };
  return { groups, picks, spot, pick };
}

export interface BeaconOpts {
  radius: number;
  segments: [number, number];
  /**
   * Drawn over everything and picked before what's behind them (the `beacon` tag).
   * Off, they're depth-tested like the model: the vehicle hides them and they pick like any part.
   */
  onTop: boolean;
  /** Pick lists to add each beacon to. */
  picks?: THREE.Object3D[];
}

/** The glowing dots that mark each spot, added to `parent`. */
export function createBeacons<S extends string>(parent: THREE.Object3D, o: BeaconOpts) {
  const beacons = new Map<S, THREE.Mesh>();
  const geom = new THREE.SphereGeometry(o.radius, ...o.segments);
  const mat = new THREE.MeshBasicMaterial({ color: hex('cyan'), transparent: true, opacity: 0.92, depthTest: !o.onTop });
  const beaconAt = (id: S, p: V3) => {
    const b = new THREE.Mesh(geom, mat);
    b.position.set(...p);
    b.renderOrder = o.onTop ? 10 : 3;
    tag(b, 'spot', id);
    if (o.onTop) tag(b, 'beacon', true);
    parent.add(b);
    beacons.set(id, b);
    o.picks?.push(b);
    return b;
  };
  return { beacons, beaconAt };
}

/**
 * Lids, doors and panels that tween open and shut. `apply(k)` poses one at k (0 shut, 1 open);
 * lids without a hook are ignored. `tag` keeps one rig's tweens apart from another's.
 */
export function createLids<L extends string>(apply: Partial<Record<L, (k: number) => void>>, o: { tag: string; ms: number | ((lid: L) => number) }) {
  const state = new Map<L, { open: boolean; k: number }>();
  const isOpen = (lid: L) => state.get(lid)?.open ?? false;
  const setLid = (lid: L, open: boolean): void => {
    const pose = apply[lid];
    if (!pose || isOpen(lid) === open) return;
    const st = state.get(lid) ?? { open, k: 0 };
    st.open = open;
    state.set(lid, st);
    const k0 = st.k;
    tween({
      duration: typeof o.ms === 'number' ? o.ms : o.ms(lid),
      ease: easeInOutCubic,
      tag: `${o.tag}:${lid}`,
      update: (t) => {
        st.k = lerp(k0, open ? 1 : 0, t);
        pose(st.k);
      },
    });
  };
  return { setLid, isOpen };
}

/** For outline highlighting: the meshes under each spot's group that draw (not ink hulls, pick boxes or crease lines). */
export function glowMeshes<S extends string>(groups: Map<S, THREE.Object3D>): Map<S, THREE.Mesh[]> {
  const glow = new Map<S, THREE.Mesh[]>();
  for (const [id, g] of groups) {
    const list: THREE.Mesh[] = [];
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || tagOf(m, 'ink')) return;
      if (Array.isArray(m.material)) return void list.push(m);
      const mat = m.material as THREE.Material & { isLineMaterial?: boolean; opacity: number };
      if (mat.visible !== false && !mat.isLineMaterial && !(mat.transparent && mat.opacity < 0.05)) list.push(m);
    });
    glow.set(id, list);
  }
  return glow;
}
