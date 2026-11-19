import * as THREE from 'three';
import { hex, LIGHT } from '../theme';
import type { V3 } from './kit';
import { MAT } from './materials';

export interface Lighting {
  sky: { color: number; intensity: number };
  key: { pos: V3; intensity: number; shadowMap: number; shadowExtent: number; shadowFar: number; bias: number };
  rims: { pink: { pos: V3; intensity: number }; cyan: { pos: V3; intensity: number } };
  front: { pos: V3; intensity: number };
}

export interface Ground { center: V3; disc?: number; ring: [number, number]; ringY: number; segments: number }

/** Sky fill, the shadow-casting key, two colored rims and a soft front light. Returns the key. */
export function addLights(scene: THREE.Scene, l: Lighting): THREE.DirectionalLight {
  scene.add(new THREE.HemisphereLight(l.sky.color, LIGHT.ground, l.sky.intensity));
  const key = new THREE.DirectionalLight(LIGHT.key, l.key.intensity);
  key.position.set(...l.key.pos);
  key.castShadow = true;
  key.shadow.mapSize.set(l.key.shadowMap, l.key.shadowMap);
  key.shadow.camera.left = key.shadow.camera.bottom = -l.key.shadowExtent;
  key.shadow.camera.right = key.shadow.camera.top = l.key.shadowExtent;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = l.key.shadowFar;
  key.shadow.bias = l.key.bias;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  for (const [color, rim] of [[LIGHT.rimPink, l.rims.pink], [LIGHT.rimCyan, l.rims.cyan]] as const) {
    const r = new THREE.DirectionalLight(color, rim.intensity);
    r.position.set(...rim.pos);
    scene.add(r);
  }
  const front = new THREE.DirectionalLight(LIGHT.front, l.front.intensity);
  front.position.set(...l.front.pos);
  scene.add(front);
  return key;
}

/** The disc the model stands on, if any, and the ring round it. */
export function addGround(scene: THREE.Scene, g: Ground): void {
  if (g.disc) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(g.disc, g.segments), MAT.ground());
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(...g.center);
    disc.receiveShadow = true;
    scene.add(disc);
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(g.ring[0], g.ring[1], g.segments),
    new THREE.MeshBasicMaterial({ color: hex('bg'), transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(g.center[0], g.ringY, g.center[2]);
  scene.add(ring);
}
