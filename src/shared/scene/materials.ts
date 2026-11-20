import * as THREE from 'three';
import { toon } from '../toon';
import { hex, TONE } from '../theme';

/** Material recipes more than one workshop uses. Each call makes a new material. */
export const MAT = {
  brass: () => toon(TONE.brass, { shine: 0.8, metal: 0.6 }),
  red: () => toon(TONE.safetyRed),
  coldBlue: () => toon(TONE.coldBlue),
  hose: () => toon(TONE.hose, { shine: 0.4 }),
  terracotta: () => toon(TONE.terracotta),
  pvc: () => toon(TONE.porcelain, { shine: 0.4 }),
  water: () => new THREE.MeshBasicMaterial({ color: hex('water'), transparent: true, opacity: 0.5 }),
  ground: () => toon(TONE.ground, { halftone: 1 }),
};
