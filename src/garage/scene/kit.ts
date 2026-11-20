import * as THREE from 'three';
import { toon, type ToonOpts } from '../../shared/toon';
import { TONE } from '../../shared/theme';
import { roundedBox, type Rounding, type V3, textured } from '../../shared/scene/kit';
import { FINISH } from '../../shared/scene/materials';

/** Everything in the garage that isn't the car's body paint. */
export const C = {
  tire: 0x23202a,
  barrel: 0x4a4e5a,
  chrome: 0xe6ecf5,
  trim: 0x24212c,
  engine: 0x5c6273,
  coolant: 0xe9f1f5,
  coolantCap: 0xff4f9a,
  washer: 0x4aa3df,
  washerCap: 0x2b6cb0,
  oil: 0xf5c542,
  disc: 0xa1a7b2,
  lampBezel: 0x14121a,
  lamp: 0xffe7a8,
  lampGlow: 0xffd77a,
  taillight: 0xff3049,
  /** A shade off `trim`: belts, fuse boxes, the motorcycle frame, saddles. */
  darkPart: 0x2a2730,
  marker: 0xffa53a,
  mirror: 0xbfe3ff,
  motoPaint: 0x17a89e,
  bikePaint: 0xffc531,
};

/** The garage's shared material recipes. Each call makes a fresh material, so a highlight stays on its own mesh. */
export const M = {
  chrome: () => toon(C.chrome, { shine: 1, metal: 0.9 }),
  /** `bright` for polished pipes, covers and rims; `brushed` for spokes, levers and fins. */
  metal: (grade: 'bright' | 'brushed' = 'brushed') => toon(TONE.polished, grade === 'bright' ? FINISH.chrome : FINISH.brushed),
  /** `matte` for a tire lying flat, whose face would catch the key light. */
  rubber: (grade: 'tread' | 'matte' = 'tread') => toon(C.tire, grade === 'tread' ? { shine: 0.15 } : {}),
  casting: () => toon(C.engine, FINISH.satin),
  trim: (o?: ToonOpts) => toon(C.trim, o),
  /** Satin dark plastic and powder coat: the motorcycle frame, fuse box lids. */
  frame: () => toon(C.darkPart, { shine: 0.3 }),
  /** Engine covers, plenums and the derailleur cage. */
  cover: () => toon(TONE.cover, { shine: 0.5 }),
  /** Self-lit: headlights, tail lights, markers, the oil window. `glow` is the emissive intensity. */
  lamp: (color: number, glow = 0.5, glowColor = color) => toon(color, { emissive: glowColor, emissiveIntensity: glow, shine: 0.85, halftone: 0 }),
};

/** The car's panels round off finer than the shared default, and as tight as a thin part needs. */
const CAR: Rounding = { segments: 3, margin: 1e-3, least: -Infinity };
export const rbox = (w: number, h: number, d: number, r = 0.02) => roundedBox(w, h, d, r, CAR);

/**
 * A printed label or screen laid flat just off a surface; it faces +z until `rot` turns it.
 * Pass `glow` for backlit faces (gauges, screens) that shouldn't take shading.
 */
export function decal(parent: THREE.Object3D, map: THREE.Texture, w: number, h: number, pos: V3, rot: V3 = [0, 0, 0], o: { glow?: boolean; round?: boolean } = {}): THREE.Mesh {
  const geo = o.round ? new THREE.CircleGeometry(w / 2, 28) : new THREE.PlaneGeometry(w, h);
  const mat = o.glow ? new THREE.MeshBasicMaterial({ map }) : textured(map, { halftone: 0.4 });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -2;
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
