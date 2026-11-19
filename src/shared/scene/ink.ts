import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { HullSet } from '../toon';

/** Marks objects whose own position, rotation, scale or visibility animates at runtime. */
export function moves(...objs: THREE.Object3D[]): void {
  for (const o of objs) o.userData.moves = true;
}

/**
 * The objects under `root` that move or hide relative to their parent at runtime: whatever posing every lid open
 * changes, plus each object marked with `moves`. Call it with the lids shut; it shuts them again.
 */
export function findMovers(root: THREE.Object3D, poses: ((k: number) => void)[]): Set<THREE.Object3D> {
  const state = () => {
    root.updateMatrixWorld(true);
    const s = new Map<THREE.Object3D, string>();
    root.traverse((o) => s.set(o, `${o.matrix.elements.join()}|${o.visible}`));
    return s;
  };
  const shut = state();
  for (const p of poses) p(1);
  const open = state();
  for (const p of poses) p(0);
  root.updateMatrixWorld(true);
  const movers = new Set<THREE.Object3D>();
  root.traverse((o) => {
    if (o.userData.moves || shut.get(o) !== open.get(o)) movers.add(o);
  });
  return movers;
}

/** Whether `o` moves with one of `movers` (or is one), below `root`. */
export function rides(o: THREE.Object3D | null, movers: Set<THREE.Object3D>, root: THREE.Object3D): boolean {
  for (; o && o !== root; o = o.parent) if (movers.has(o)) return true;
  return false;
}

/**
 * Merges ink hulls into one mesh per rigid frame and ink style, turning hundreds of hull draw calls into dozens.
 * A frame is the nearest of the hull's mesh and its ancestors that is one of `movers`, an area's group or `root`;
 * nothing between a mesh and its frame moves, so the merged hull lives in the frame and moves and hides with it.
 * Meshes that highlight together (the same `glow` lists) share a hull, which each reaches through `userData.hull`.
 */
export function mergeInk(root: THREE.Object3D, movers: Set<THREE.Object3D>, glow?: Map<string, THREE.Object3D[]>): void {
  root.updateMatrixWorld(true);
  const glowOf = new Map<THREE.Object3D, string>();
  for (const [id, ms] of glow ?? []) for (const m of ms) glowOf.set(m, glowOf.has(m) ? `${glowOf.get(m)}|${id}` : id);
  const frameOf = (o: THREE.Object3D): THREE.Object3D => {
    let f = o;
    while (f !== root && f.parent && !movers.has(f) && !(f.userData.area && !(f as THREE.Mesh).isMesh)) f = f.parent;
    return f;
  };
  const sets = new Map<string, { frame: THREE.Object3D; hl: HullSet; hulls: THREE.Mesh[] }>();
  root.traverse((o) => {
    const host = o.parent;
    if (!o.userData.ink || !host || (o as THREE.InstancedMesh).isInstancedMesh) return;
    const frame = frameOf(host);
    for (let a: THREE.Object3D | null = host; a && a !== frame; a = a.parent) if (!a.visible) return;
    const hl = o.userData.hl as HullSet;
    const key = `${frame.uuid}|${hl.base.uuid}|${glowOf.get(host) ?? ''}`;
    const set = sets.get(key) ?? { frame, hl, hulls: [] };
    set.hulls.push(o as THREE.Mesh);
    sets.set(key, set);
  });
  const inv = new THREE.Matrix4();
  const rel = new THREE.Matrix4();
  for (const { frame, hl, hulls } of sets.values()) {
    if (hulls.length < 2) continue;
    inv.copy(frame.matrixWorld).invert();
    const parts = hulls.map((h) => {
      const g = h.geometry.clone().applyMatrix4(rel.multiplyMatrices(inv, h.matrixWorld));
      // A mirrored part turns inside out once its transform is baked in; flip its winding back so back faces stay back faces.
      if (rel.determinant() < 0 && g.index) {
        const ix = g.index;
        for (let i = 0; i < ix.count; i += 3) {
          const a = ix.getX(i + 1);
          ix.setX(i + 1, ix.getX(i + 2));
          ix.setX(i + 2, a);
        }
      }
      return g;
    });
    const merged = new THREE.Mesh(mergeGeometries(parts), hl.base);
    for (const g of parts) g.dispose();
    merged.raycast = () => {};
    merged.userData.ink = true;
    merged.userData.hl = hl;
    frame.add(merged);
    for (const h of hulls) {
      (h.parent as THREE.Object3D).userData.hull = merged;
      h.removeFromParent();
    }
  }
}
