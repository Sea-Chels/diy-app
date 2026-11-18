import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mapped, type V3 } from '../../shared/scene/kit';

/** Everything on the car that isn't body paint. */
export const C = {
  tire: 0x23202a,
  rim: 0xd4dbe8,
  barrel: 0x4a4e5a,
  chrome: 0xe6ecf5,
  trim: 0x24212c,
  bay: 0x1b1922,
  engine: 0x5c6273,
  cover: 0x2f3240,
  battery: 0x2c2e36,
  airbox: 0x3b404c,
  coolant: 0xe9f1f5,
  coolantCap: 0xff4f9a,
  washer: 0x4aa3df,
  washerCap: 0x2b6cb0,
  fuse: 0x2a2833,
  oil: 0xf5c542,
  caliper: 0xe2364a,
  disc: 0xa1a7b2,
  positive: 0xe2364a,
  lampBezel: 0x14121a,
  lamp: 0xffe7a8,
  lampGlow: 0xffd77a,
  taillight: 0xff3049,
  hose: 0x1d1c22,
  belt: 0x2a2730,
  marker: 0xffa53a,
  reverse: 0xf4f1ff,
  mirror: 0xbfe3ff,
};

export const rbox = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));

/**
 * A printed label or screen laid flat just off a surface; it faces +z until `rot` turns it.
 * Pass `glow` for backlit faces (gauges, screens) that shouldn't take shading.
 */
export function decal(parent: THREE.Object3D, map: THREE.Texture, w: number, h: number, pos: V3, rot: V3 = [0, 0, 0], o: { glow?: boolean; round?: boolean } = {}): THREE.Mesh {
  const geo = o.round ? new THREE.CircleGeometry(w / 2, 28) : new THREE.PlaneGeometry(w, h);
  const mat = o.glow ? new THREE.MeshBasicMaterial({ map }) : mapped(0xffffff, map, { halftone: 0.4 });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -2;
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
