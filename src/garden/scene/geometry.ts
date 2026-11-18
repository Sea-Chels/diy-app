import * as THREE from 'three';

/** Metres to scene units. */
export const K = 0.6;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const UP = V(0, 1, 0);

export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
export const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
export const LOW_SPHERE = new THREE.SphereGeometry(1, 14, 10);

/** Corrugated sheet `len` long and `h` tall, ribs running up, facing +z. */
const corrCache = new Map<string, THREE.BufferGeometry>();
export function corrugated(len: number, h: number): THREE.BufferGeometry {
  const key = `${len}|${h}`;
  const hit = corrCache.get(key);
  if (hit) return hit;
  const amp = 0.011;
  const period = 0.076;
  const t = 0.004;
  const n = Math.ceil(len / period) * 8;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    pts.push(new THREE.Vector2(x, amp * Math.sin((x / period) * Math.PI * 2)));
  }
  for (let i = n; i >= 0; i--) {
    const x = -len / 2 + (len * i) / n;
    pts.push(new THREE.Vector2(x, amp * Math.sin((x / period) * Math.PI * 2) - t));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  corrCache.set(key, g);
  return g;
}

/** Canning jar, base at y=0, 0.14 m tall. */
export const JAR = (() => {
  const pts = [V(0, 0), V(0.04, 0), V(0.046, 0.01), V(0.046, 0.1), V(0.036, 0.118), V(0.034, 0.13), V(0, 0.13)].map((v) => new THREE.Vector2(v.x, v.y));
  return new THREE.LatheGeometry(pts, 14);
})();

/** Raised bed footprint and height; the cutaway and kitchen beds share it. */
export const BW = 2.4;
export const BD = 1.2;
export const BH = 0.6;
