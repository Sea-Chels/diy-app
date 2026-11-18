import * as THREE from 'three';
import { toon } from '../toon';
import { hex } from '../theme';

/** Material recipes more than one workshop uses. Each call makes a new material. */
export const MAT = {
  brass: () => toon(0xd8b04a, { shine: 0.8, metal: 0.6 }),
  /** Fire-extinguisher, shut-off and hot-tap red. */
  red: () => toon(0xd8432f),
  /** The cold tap's blue next to `red`. */
  coldBlue: () => toon(0x3b82f6),
  hose: () => toon(0x3f9a4a, { shine: 0.4 }),
  terracotta: () => toon(0xc8643a),
  pvc: () => toon(0xf2f2ee, { shine: 0.4 }),
  water: () => new THREE.MeshBasicMaterial({ color: hex('water'), transparent: true, opacity: 0.5 }),
  /** The dark disc the models stand on. */
  ground: () => toon(0x1d2133, { halftone: 1 }),
};
