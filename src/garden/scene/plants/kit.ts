/**
 * Procedural, recognizable comic plants. Each builder drops a plant at a spot
 * inside an area group. Leaves, petals, berries and short stalks go through
 * instance batches (one draw call per kind per area); stems and vines are
 * tubes. Everything plant-like sways with the same wind so outlines stay put.
 * Sizes are meters.
 */
import * as THREE from 'three';
import { type Batches, canvasTex, leafGeo, leafMatrix, leafTexture, plantMat, jitter, WIND } from '../../../shared/scene/kit';
import type { Season } from '../../data/setup';
import type { InkWeight } from '../../../shared/toon';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const UP = V(0, 1, 0);

/** Unit cylinder from y=0 to y=1: stalks, petioles, spikes. */
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0);
export const SPHERE = new THREE.SphereGeometry(1, 9, 6);
export const CAPSULE = new THREE.CapsuleGeometry(1, 2, 4, 8);
/** Cone with its tip at y = -1 and base at 0 (carrots). */
export const ROOT = new THREE.ConeGeometry(1, 1, 8, 1).rotateX(Math.PI).translate(0, -0.5, 0);
export const DISC = new THREE.CylinderGeometry(1, 1, 0.06, 18, 1);

/** Flat flower with `n` rounded petals, face +z, centered on the origin. */
const flowerCache = new Map<string, THREE.BufferGeometry>();
export function flowerGeo(n: number, inner = 0.25, cup = 0.2, sharp = 0.6): THREE.BufferGeometry {
  const key = `${n}|${inner}|${cup}|${sharp}`;
  const hit = flowerCache.get(key);
  if (hit) return hit;
  const pts: THREE.Vector2[] = [];
  const steps = n * 10;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = inner + (1 - inner) * Math.abs(Math.cos((n * a) / 2)) ** sharp;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.04, bevelEnabled: false, curveSegments: 2 });
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) + cup * (x * x + y * y));
  }
  g.computeVertexNormals();
  flowerCache.set(key, g);
  return g;
}

/** Bumpy ball: marigold and zinnia pompoms, chive flowers. */
export const POM = (() => {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const v = V(pos.getX(i), pos.getY(i), pos.getZ(i));
    const k = 1 + 0.12 * Math.sin(v.x * 9) * Math.sin(v.y * 8) * Math.sin(v.z * 7);
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y * 0.8, v.z);
  }
  g.computeVertexNormals();
  return g;
})();

/** Ribbed pumpkin, radius 1. */
export const PUMPKIN = (() => {
  const g = new THREE.SphereGeometry(1, 24, 14);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const v = V(pos.getX(i), pos.getY(i), pos.getZ(i));
    const a = Math.atan2(v.z, v.x);
    const rib = 1 - 0.08 * Math.abs(Math.sin(a * 5)) ** 0.6;
    v.x *= rib;
    v.z *= rib;
    v.y *= 0.72;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();

/** Strawberry: rounded cone, tip down. */
export const BERRY = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(Math.sin(t * Math.PI * 0.95) * (0.55 + 0.45 * t) * 0.8, -1 + t * 1.15));
  }
  return new THREE.LatheGeometry(pts, 12);
})();

/** Corn leaf: long strap that arches up and over. */
export const CORN_LEAF = leafGeo({ shape: 'strap', w: 0.075, bend: 1.2, fold: 0.14, ruffle: 0.012, ruffleFreq: 30, segments: 24 });

export interface PlantKit {
  b: Batches;
  season: Season;
  /** Size of annuals: small in spring, full later. */
  growth: number;
  r: () => number;
  /** White veined leaf tinted per instance. */
  leaf: THREE.MeshToonMaterial;
  /** White, untextured, tinted per instance: petals, berries, stalks. */
  plain: THREE.MeshToonMaterial;
  /** Like plain, with a hard highlight: tomatoes, peppers, berries. */
  shiny: THREE.MeshToonMaterial;
  stem: (color: THREE.ColorRepresentation) => THREE.MeshToonMaterial;
  seedHead: THREE.MeshToonMaterial;
}

export function plantKit(b: Batches, season: Season, r: () => number): PlantKit {
  const stems = new Map<number, THREE.MeshToonMaterial>();
  const seed = canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#4a2a14';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 520; i++) {
      const a = i * 2.39996;
      const rr = Math.sqrt(i / 520) * 62;
      ctx.fillStyle = i % 3 ? '#2a170b' : '#6b4421';
      ctx.beginPath();
      ctx.arc(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const leaf = plantMat(0xffffff);
  leaf.map = leafTexture();
  return {
    b,
    season,
    growth: season === 'spring' ? 0.55 : 1,
    r,
    leaf,
    plain: plantMat(0xffffff),
    shiny: plantMat(0xffffff, { shine: 0.65 }),
    stem: (c) => {
      const key = new THREE.Color(c).getHex();
      const m = stems.get(key) ?? plantMat(c);
      stems.set(key, m);
      return m;
    },
    seedHead: (() => {
      const m = plantMat(0xffffff);
      m.map = seed;
      return m;
    })(),
  };
}

/** Nearest ancestor marked as a batch root (an area group). */
function batchRoot(o: THREE.Object3D): THREE.Object3D {
  let p: THREE.Object3D | null = o;
  while (p && !p.userData.batchRoot) p = p.parent;
  return p ?? o;
}

/** A plant's own group, placed in its area. */
export function plantGroup(parent: THREE.Object3D, p: THREE.Vector3, rotY = 0, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.position.copy(p);
  g.rotation.y = rotY;
  g.scale.setScalar(scale);
  parent.add(g);
  return g;
}

/** Add an instance given in the plant group's local space. */
export function put(k: PlantKit, g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, local: THREE.Matrix4, color: THREE.ColorRepresentation, ink: InkWeight | null = 'thin'): void {
  const root = batchRoot(g);
  root.updateWorldMatrix(true, false);
  g.updateWorldMatrix(true, false);
  const rel = new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(g.matrixWorld).multiply(local);
  k.b.add(root, geo, mat, rel, { color, wind: WIND, ink });
}

/** Face matrix: +z of the geometry points along `face`, spun by `spin`. */
export function faceM(pos: THREE.Vector3, face: THREE.Vector3, s: number, spin = 0): THREE.Matrix4 {
  const Z = face.clone().normalize();
  const ref = Math.abs(Z.y) > 0.9 ? V(1, 0, 0) : UP;
  const X = new THREE.Vector3().crossVectors(ref, Z).normalize().applyAxisAngle(Z, spin);
  const Y = new THREE.Vector3().crossVectors(Z, X);
  return new THREE.Matrix4().makeBasis(X.multiplyScalar(s), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(pos);
}
export const ballM = (pos: THREE.Vector3, sx: number, sy = sx, sz = sx) => new THREE.Matrix4().makeScale(sx, sy, sz).setPosition(pos);
/** Stalk from `a` toward `dir` with length and radius (uses the unit cylinder). */
export const stalkM = (a: THREE.Vector3, dir: THREE.Vector3, len: number, r: number) => leafMatrix(a, dir, V(0, 0, 1).add(V(0.3, 0, 0)), r, len, r);

export const mix = (a: number, b: number, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);
export const vary = (k: PlantKit, c: number, amt = 0.08) => new THREE.Color(c).offsetHSL(jitter(k.r, amt * 0.15), jitter(k.r, amt), jitter(k.r, amt));
/** Outward direction at angle `a`, tilted up by `tilt` radians. */
export const outUp = (a: number, tilt: number) => V(Math.cos(a) * Math.cos(tilt), Math.sin(tilt), Math.sin(a) * Math.cos(tilt));

export const G = {
  roundOuter: leafGeo({ shape: 'round', w: 0.55, wave: 0.07, ruffle: 0.025, cup: 0.06, bend: 0.35, segments: 28 }),
  roundInner: leafGeo({ shape: 'round', w: 0.5, wave: 0.06, cup: 0.12, bend: -0.25 }),
  ovate: leafGeo({ shape: 'ovate', w: 0.42, bend: 0.2, fold: 0.12 }),
  ovateSerrate: leafGeo({ shape: 'ovate', w: 0.42, teeth: 8, toothDepth: 0.14, bend: 0.18, fold: 0.1 }),
  ovateCup: leafGeo({ shape: 'ovate', w: 0.4, cup: 0.22, bend: -0.12, fold: -0.1 }),
  chard: leafGeo({ shape: 'ovate', w: 0.4, wave: 0.05, bend: 0.3, fold: 0.18 }),
  kale: leafGeo({ shape: 'lance', w: 0.3, teeth: 22, toothDepth: 0.2, wave: 0.12, ruffle: 0.06, ruffleFreq: 70, bend: 0.4, fold: 0.25, segments: 44 }),
  pinnate: leafGeo({ shape: 'pinnate', w: 0.26, bend: 0.25, segments: 42 }),
  lance: leafGeo({ shape: 'lance', w: 0.2, bend: 0.15 }),
  needle: leafGeo({ shape: 'lance', w: 0.14, bend: 0.05, segments: 6 }),
  obovate: leafGeo({ shape: 'obovate', w: 0.36, bend: 0.35, fold: 0.15 }),
  heart: leafGeo({ shape: 'heart', w: 0.46, bend: 0.2, fold: 0.08 }),
  heartTooth: leafGeo({ shape: 'heart', w: 0.48, teeth: 9, toothDepth: 0.1, bend: 0.25, fold: 0.06 }),
  palmate: leafGeo({ shape: 'palmate', teeth: 3, toothDepth: 0.05, cup: -0.08, bend: 0.1 }),
  petal: leafGeo({ shape: 'petal', w: 0.28, bend: -0.12, cup: 0.1, segments: 8 }),
  blade: leafGeo({ shape: 'blade', w: 0.05, bend: 0.5, segments: 6 }),
  tooth: leafGeo({ shape: 'ovate', w: 0.45, teeth: 7, toothDepth: 0.12, bend: 0.1, cup: 0.08 }),
};
