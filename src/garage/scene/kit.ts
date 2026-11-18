import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon, type ToonOpts } from '../../shared/toon';
import { mapped, type V3 } from '../../shared/scene/kit';

/** Everything in the garage that isn't the car's body paint. */
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
  oil: 0xf5c542,
  caliper: 0xe2364a,
  disc: 0xa1a7b2,
  positive: 0xe2364a,
  lampBezel: 0x14121a,
  lamp: 0xffe7a8,
  lampGlow: 0xffd77a,
  taillight: 0xff3049,
  hose: 0x1d1c22,
  /** A shade off `trim`: belts, fuse boxes, the motorcycle frame, saddles. */
  darkPart: 0x2a2730,
  marker: 0xffa53a,
  reverse: 0xf4f1ff,
  mirror: 0xbfe3ff,
  motoPaint: 0x17a89e,
  bikePaint: 0xffc531,
  chain: 0x7d828f,
  spoke: 0xc9cfdc,
};

/** The garage's shared material recipes. Each call makes a fresh material, so a highlight stays on its own mesh. */
export const M = {
  chrome: () => toon(C.chrome, { shine: 1, metal: 0.9 }),
  /** `bright` for polished pipes, covers and rims; `brushed` for spokes, levers and fins. */
  metal: (grade: 'bright' | 'brushed' = 'brushed') => toon(C.rim, grade === 'bright' ? { shine: 0.85, metal: 0.7 } : { shine: 0.65, metal: 0.5 }),
  /** `matte` for a tire lying flat, whose face would catch the key light. */
  rubber: (grade: 'tread' | 'matte' = 'tread') => toon(C.tire, grade === 'tread' ? { shine: 0.15 } : {}),
  casting: () => toon(C.engine, { shine: 0.5, metal: 0.4 }),
  trim: (o?: ToonOpts) => toon(C.trim, o),
  /** Satin dark plastic and powder coat: the motorcycle frame, fuse box lids. */
  frame: () => toon(C.darkPart, { shine: 0.3 }),
  /** Engine covers, plenums and the derailleur cage. */
  cover: () => toon(C.cover, { shine: 0.5 }),
  /** Self-lit: headlights, tail lights, markers, the oil window. `glow` is the emissive intensity. */
  lamp: (color: number, glow = 0.5, glowColor = color) => toon(color, { emissive: glowColor, emissiveIntensity: glow, shine: 0.85, halftone: 0 }),
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
