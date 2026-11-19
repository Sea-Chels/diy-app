import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { reducedMotion } from '../motion';
import { easeInOutCubic, tween } from '../tween';
import type { View } from './stage';

export interface ControlsOpts { minDistance: number; maxDistance: number; polarMargin: number; pan: boolean; rotateSpeed: number }

/**
 * Overview distance multiplier: clamp(base / aspect, min, max), so portrait screens back off.
 * `raiseLimit` lets that push past controls.maxDistance; without it the overview is clamped to the limit.
 */
export interface Fit { base: number; min: number; max: number; raiseLimit: boolean }

export interface Flight { ms: number; lift: number }

/** Orbit controls that spin slowly on their own unless reduced motion is on. */
export function createControls(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, c: ControlsOpts): OrbitControls {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = c.minDistance;
  controls.maxDistance = c.maxDistance;
  controls.maxPolarAngle = Math.PI / 2 - c.polarMargin;
  controls.enablePan = c.pan;
  controls.autoRotate = !reducedMotion();
  controls.autoRotateSpeed = c.rotateSpeed;
  return controls;
}

/** The rig's overview, backed off to fit the screen's aspect; may raise the controls' distance limit to reach it. */
export function fitOverview({ pos, target }: View, aspect: number, fit: Fit, controls: OrbitControls, maxDistance: number): View {
  const k = Math.min(fit.max, Math.max(fit.min, fit.base / aspect));
  const t = new THREE.Vector3(...target);
  const p = new THREE.Vector3(...pos).sub(t).multiplyScalar(k).add(t);
  if (fit.raiseLimit) controls.maxDistance = Math.max(maxDistance, p.distanceTo(t) * 1.15);
  return { pos: [p.x, p.y, p.z], target };
}

export function flyTo(camera: THREE.Camera, controls: OrbitControls, { pos, target }: View, flight: Flight): void {
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const p1 = new THREE.Vector3(...pos);
  const t1 = new THREE.Vector3(...target);
  // Arc slightly away from the straight line so close-ups swing in rather than slide.
  const lift = Math.min(flight.lift, p0.distanceTo(p1) * 0.12);
  tween({
    duration: flight.ms,
    ease: easeInOutCubic,
    tag: 'camera',
    shadows: false,
    update: (k) => {
      camera.position.lerpVectors(p0, p1, k);
      camera.position.y += Math.sin(k * Math.PI) * lift;
      controls.target.lerpVectors(t0, t1, k);
    },
  });
}
