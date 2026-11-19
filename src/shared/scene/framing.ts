import * as THREE from 'three';
import type { View } from './stage';
import { tagOf } from './sceneTags';

const UP = new THREE.Vector3(0, 1, 0);
/** World units a pulled-back camera keeps from the surface it backed up to. */
const CLEAR_MARGIN = 0.15;

export const shown = (o: THREE.Object3D | null): boolean => {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
};

const sight = new THREE.Raycaster();
/**
 * How far a camera can back away from `from` along `dir` (up to `far`) and still see `from`.
 * The ray runs back from the far end, so it only meets faces turned toward that camera: a
 * one-sided cutaway wall seen from behind doesn't count, but the inside of a closed object's
 * ink hull (which would fill the screen) does. Glass, pick boxes and beacons never block.
 * It tests the rig at full size: a view can be framed before the first render or mid swap-in.
 */
export function clearance(scene: THREE.Scene, rig: THREE.Object3D, from: THREE.Vector3, dir: THREE.Vector3, far: number): number {
  const grow = rig.scale;
  const scale = grow.x;
  grow.setScalar(1);
  scene.updateMatrixWorld();
  sight.set(new THREE.Vector3().copy(from).addScaledVector(dir, far), new THREE.Vector3().copy(dir).negate());
  sight.far = far;
  const hits = sight.intersectObject(scene, true);
  // Hulls opt out of raycasting so they never take a click; ask them directly.
  scene.traverse((o) => {
    if (!tagOf(o, 'ink') || !shown(o)) return;
    const proto = (o as THREE.InstancedMesh).isInstancedMesh ? THREE.InstancedMesh.prototype : THREE.Mesh.prototype;
    proto.raycast.call(o as THREE.Mesh, sight, hits);
  });
  let nearest = far;
  for (const { object: o, distance } of hits) {
    const m = o as THREE.Mesh;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material | undefined;
    if (m.isMesh && mat?.visible && !(mat.transparent && mat.opacity < 0.9) && !tagOf(o, 'beacon') && shown(o)) nearest = Math.min(nearest, far - distance);
  }
  grow.setScalar(scale);
  scene.updateMatrixWorld();
  return nearest;
}


export interface Framing { desktop: { pullback: number; shift: number }; phone: { pullback: number } }

/** How much of the canvas is covered, in px: by the floating controls along its top, and by the panel along its bottom on a phone. */
export interface Insets { height: number; top: number; bottom: number }

/** How far a camera can back away from `from` along `dir`, up to `far`, and still see it. */
export type Clearance = (from: THREE.Vector3, dir: THREE.Vector3, far: number) => number;

/**
 * Frames an area's view clear of the side panel: on desktop it pulls back and shifts aside, as `framing.desktop` says;
 * on a phone, where the panel covers the bottom of the screen, it slides and pulls back to fit the strip above it.
 */
export function frameView(v: View, fov: number, phone: boolean, insets: Insets, framing: Framing, clear: Clearance): View {
  const t = new THREE.Vector3(...v.target);
  const p = new THREE.Vector3(...v.pos);
  if (phone) {
    // The view slides down along the camera's own up (for a view looking into an engine bay, world down points into the screen)
    // until the target sits mid-strip between the floating top controls and the panel, `covered` half-heights above screen center.
    const authored = p.distanceTo(t);
    const back = new THREE.Vector3().subVectors(p, t).normalize();
    const side = new THREE.Vector3().crossVectors(back, UP).negate();
    // Straight down (or up) has no side; three's lookAt then turns screen-up to ∓z.
    const up = side.lengthSq() < 1e-12 ? new THREE.Vector3(0, 0, -Math.sign(back.y)) : new THREE.Vector3().crossVectors(side, back.clone().negate()).normalize();
    const h = insets.height;
    const top = h ? insets.top / h : 0;
    const covered = h ? insets.bottom / h - top : 0;
    const slide = up.multiplyScalar(-Math.tan(THREE.MathUtils.degToRad(fov / 2)) * covered);
    // Both moves grow with distance, so the camera sits on one line, target + (back + slide) × distance. Pull back along it
    // to fit the short strip, stopping short of anything in the way (the car beside a motorcycle view).
    const path = new THREE.Vector3().addVectors(back, slide);
    const step = path.length();
    path.normalize();
    const start = new THREE.Vector3().copy(t).addScaledVector(path, authored * step);
    const extra = authored * step * (framing.phone.pullback - 1);
    const dist = authored + Math.max(0, Math.min(extra, clear(start, path, extra) - CLEAR_MARGIN)) / step;
    p.copy(t).addScaledVector(path, dist * step);
    t.addScaledVector(slide, dist);
  } else {
    p.sub(t).multiplyScalar(framing.desktop.pullback).add(t);
    const right = new THREE.Vector3().subVectors(t, p).cross(UP).normalize();
    const shift = right.multiplyScalar(p.distanceTo(t) * framing.desktop.shift);
    t.add(shift);
    p.add(shift);
  }
  return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
}
