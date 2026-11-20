import * as THREE from 'three';
import { toon } from '../toon';
import { hex, TONE } from '../theme';

/** Shine and metal grades for bare metal, dullest first. Pass one as toon's options, or spread it in with more. */
export const FINISH = {
  /** Castings, covers, the breaker panel, bronze. */
  satin: { shine: 0.5, metal: 0.4 },
  /** Heatsinks, lug nuts, sprockets, brake discs. */
  brushed: { shine: 0.6, metal: 0.5 },
  /** Bare steel, galvanized steel, copper pipe. */
  bright: { shine: 0.7, metal: 0.6 },
  /** Brass, copper, CPU lids, appliance steel. */
  polished: { shine: 0.8, metal: 0.6 },
  /** Chrome fixtures, blades, polished rims. */
  chrome: { shine: 0.9, metal: 0.8 },
} as const;

/** Material recipes more than one workshop uses. Each call makes a new material. */
export const MAT = {
  brass: () => toon(TONE.brass, FINISH.polished),
  red: () => toon(TONE.safetyRed),
  coldBlue: () => toon(TONE.coldBlue),
  hose: () => toon(TONE.hose, { shine: 0.4 }),
  terracotta: () => toon(TONE.terracotta),
  pvc: () => toon(TONE.porcelain, { shine: 0.4 }),
  water: () => new THREE.MeshBasicMaterial({ color: hex('water'), transparent: true, opacity: 0.5 }),
  ground: () => toon(TONE.ground, { halftone: 1 }),
};
