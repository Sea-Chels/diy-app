import * as THREE from 'three';
import type { V3 } from '../../shared/scene/kit';
import type { View } from '../../shared/scene/stage';
import { hex } from '../../shared/theme';
import { createBeacons, createLids } from '../../shared/scene/rigKit';
import { moves } from '../../shared/scene/ink';
import type { TweenScope } from '../../shared/tween';
import { PARTS, type LidId, type PartId } from '../data/parts';
import { tag as setTag, tagOf } from '../../shared/scene/sceneTags';

/** `tag` makes meshes a part's hotspots. Give each its own material: `shareMaterials` keeps a part's glow on that part. */
export function createParts() {
  const hotspots = new Map<PartId, THREE.Mesh[]>();

  const tag = (part: PartId, ...meshes: THREE.Mesh[]) => {
    const list = hotspots.get(part) ?? [];
    for (const m of meshes) {
      setTag(m, 'spot', part);
      list.push(m);
    }
    hotspots.set(part, list);
  };

  return { hotspots, tag };
}

/** Glowing dots marking each part, added to `parent`. They hide while their part can't be picked (its lid is shut). */
export function createPartBeacons(parent: THREE.Object3D, canPick: (part: PartId) => boolean) {
  // Unlike the other workshops' beacons these are depth-tested, so the vehicle hides them and they pick like any other part.
  const { beacons, beaconAt: dot } = createBeacons<PartId>(parent, { radius: 0.045, segments: [16, 16], onTop: false });
  const beaconAt = (part: PartId, p: V3) => setTag(dot(part, p), 'seen', () => canPick(part));
  return { beacons, beaconAt };
}

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

/** A material's look, for spotting copies: every setting and uniform value, but not its identity. */
function look(m: THREE.Material): string {
  const out: unknown[] = [m.type, m.customProgramCacheKey()];
  for (const [k, v] of Object.entries(m)) {
    if (k === 'uuid' || k === 'id' || k === 'version' || typeof v === 'function') continue;
    if (v?.isColor) out.push(k, (v as THREE.Color).getHex());
    else if (v?.isTexture) out.push(k, (v as THREE.Texture).uuid);
    else if (typeof v?.toArray === 'function') out.push(k, v.toArray());
    else out.push(k, v);
  }
  return JSON.stringify(out);
}

/**
 * Lets meshes whose materials look the same share one, so the garage holds a few dozen materials instead of
 * hundreds. Materials a part's glow tints share only with ones it tints alike, and paint only with paint, which
 * is recolored later. Returns each replaced material's stand-in.
 */
export function shareMaterials(root: THREE.Object3D, hotspots: Map<PartId, THREE.Mesh[]>, paint: THREE.Material[] = []): Map<THREE.Material, THREE.Material> {
  // Keyed by material, not mesh: a part's glow also tints any other mesh that was built with its material.
  const parts = new Map<THREE.Material, string>();
  for (const [p, ms] of hotspots) for (const m of ms) if (!Array.isArray(m.material)) parts.set(m.material, `${parts.get(m.material) ?? ''}|${p}`);
  const painted = new Set(paint);
  const kept = new Map<string, THREE.Material>();
  const swapped = new Map<THREE.Material, THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || tagOf(o, 'ink') || Array.isArray(mesh.material)) return;
    const m = mesh.material;
    const key = `${parts.get(m) ?? ''}|${painted.has(m)}|${look(m)}`;
    const keep = kept.get(key) ?? m;
    kept.set(key, keep);
    if (keep === m) return;
    swapped.set(m, keep);
    mesh.material = keep;
  });
  return swapped;
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
  /** Ends its running tweens, when the garage is rebuilt. */
  stop(): void;
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

/** Hinged panels that swing open for the parts behind them, in the vehicle's `tweens`. */
export function createPivotLids(lids: Partial<Record<LidId, LidSpec>>, tweens: TweenScope) {
  const apply: Partial<Record<LidId, (k: number) => void>> = {};
  for (const [id, { pivot, axis, open }] of Object.entries(lids) as [LidId, LidSpec][]) {
    moves(pivot);
    apply[id] = (k) => (pivot.rotation[axis] = open * k);
  }
  const { setLid, isOpen } = createLids<LidId>(apply, { tweens, ms: 750 });
  const canPick = (part: PartId) => {
    const { behind, seeThrough } = PARTS[part];
    return !behind || seeThrough === true || isOpen(behind);
  };
  return { setLid, canPick };
}
