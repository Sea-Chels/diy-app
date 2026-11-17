/**
 * Procedural, recognisable comic plants. Each builder drops a plant at a spot
 * inside an area group. Leaves, petals, berries and short stalks go through
 * instance batches (one draw call per kind per area); stems and vines are
 * tubes. Everything plant-like sways with the same wind so outlines stay put.
 * Sizes are metres.
 */
import * as THREE from 'three';
import { Batches, canvasTex, leafGeo, leafMatrix, leafTexture, plantMat, range, jitter, tube, add, WIND, type LeafOpts } from './kit';

export type Season = 'spring' | 'summer' | 'fall';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// ---------- shared geometry ----------

/** Unit cylinder from y=0 to y=1: stalks, petioles, spikes. */
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0);
const SPHERE = new THREE.SphereGeometry(1, 9, 6);
const CAPSULE = new THREE.CapsuleGeometry(1, 2, 4, 8);
/** Cone with its tip at y = -1 and base at 0 (carrots). */
const ROOT = new THREE.ConeGeometry(1, 1, 8, 1).rotateX(Math.PI).translate(0, -0.5, 0);
const DISC = new THREE.CylinderGeometry(1, 1, 0.06, 18, 1);

/** Flat flower with `n` rounded petals, face +z, centred on the origin. */
const flowerCache = new Map<string, THREE.BufferGeometry>();
export function flowerGeo(n: number, inner = 0.25, cup = 0.2, sharp = 0.6): THREE.BufferGeometry {
  const key = `${n}|${inner}|${cup}|${sharp}`;
  const hit = flowerCache.get(key);
  if (hit) return hit;
  const pts: THREE.Vector2[] = [];
  const steps = n * 10;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = inner + (1 - inner) * Math.pow(Math.abs(Math.cos((n * a) / 2)), sharp);
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
const POM = (() => {
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
const PUMPKIN = (() => {
  const g = new THREE.SphereGeometry(1, 24, 14);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const v = V(pos.getX(i), pos.getY(i), pos.getZ(i));
    const a = Math.atan2(v.z, v.x);
    const rib = 1 - 0.08 * Math.pow(Math.abs(Math.sin(a * 5)), 0.6);
    v.x *= rib;
    v.z *= rib;
    v.y *= 0.72;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();

/** Strawberry: rounded cone, tip down. */
const BERRY = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(Math.sin(t * Math.PI * 0.95) * (0.55 + 0.45 * t) * 0.8, -1 + t * 1.15));
  }
  return new THREE.LatheGeometry(pts, 12);
})();

/** Corn leaf: long strap that arches up and over. */
const CORN_LEAF = leafGeo({ shape: 'strap', w: 0.075, bend: 1.2, fold: 0.14, ruffle: 0.012, ruffleFreq: 30, segments: 24 });

// ---------- materials ----------

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
      let m = stems.get(key);
      if (!m) stems.set(key, (m = plantMat(c)));
      return m;
    },
    seedHead: (() => {
      const m = plantMat(0xffffff);
      m.map = seed;
      return m;
    })(),
  };
}

// ---------- placement helpers ----------

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
function put(k: PlantKit, g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, local: THREE.Matrix4, color: THREE.ColorRepresentation, ink: 'thin' | 'body' | null = 'thin'): void {
  const root = batchRoot(g);
  root.updateWorldMatrix(true, false);
  g.updateWorldMatrix(true, false);
  const rel = new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(g.matrixWorld).multiply(local);
  k.b.add(root, geo, mat, rel, { color, wind: WIND, ink });
}

/** Face matrix: +z of the geometry points along `face`, spun by `spin`. */
function faceM(pos: THREE.Vector3, face: THREE.Vector3, s: number, spin = 0): THREE.Matrix4 {
  const Z = face.clone().normalize();
  const ref = Math.abs(Z.y) > 0.9 ? V(1, 0, 0) : UP;
  const X = new THREE.Vector3().crossVectors(ref, Z).normalize().applyAxisAngle(Z, spin);
  const Y = new THREE.Vector3().crossVectors(Z, X);
  return new THREE.Matrix4().makeBasis(X.multiplyScalar(s), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(pos);
}
const ballM = (pos: THREE.Vector3, sx: number, sy = sx, sz = sx) => new THREE.Matrix4().makeScale(sx, sy, sz).setPosition(pos);
/** Stalk from `a` toward `dir` with length and radius (uses the unit cylinder). */
const stalkM = (a: THREE.Vector3, dir: THREE.Vector3, len: number, r: number) => leafMatrix(a, dir, V(0, 0, 1).add(V(0.3, 0, 0)), r, len, r);

const mix = (a: number, b: number, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const vary = (k: PlantKit, c: number, amt = 0.08) => new THREE.Color(c).offsetHSL(jitter(k.r, amt * 0.15), jitter(k.r, amt), jitter(k.r, amt));
/** Outward direction at angle `a`, tilted up by `tilt` radians. */
const outUp = (a: number, tilt: number) => V(Math.cos(a) * Math.cos(tilt), Math.sin(tilt), Math.sin(a) * Math.cos(tilt));

const G = {
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

// ---------- greens ----------

export function lettuce(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, o: { red?: boolean; s?: number } = {}): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, (o.s ?? 1) * (k.season === 'spring' ? 1 : 0.95));
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const a = i * 2.39996;
    const tilt = THREE.MathUtils.lerp(0.32, 1.35, t);
    const len = THREE.MathUtils.lerp(0.15, 0.08, t);
    const dir = outUp(a, tilt);
    const base = V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.012 * (1 - t)).add(V(0, 0.01, 0));
    const col = o.red ? mix(0x8d2f50, 0x9fc35a, t * 0.7) : mix(0x6fbf3c, 0xc8ec7a, t);
    put(k, g, t < 0.55 ? G.roundOuter : G.roundInner, k.leaf, leafMatrix(base, dir, UP, len, len, len), col);
  }
  return g;
}

export function chard(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, stemColor: number): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.9 + 0.1);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const tilt = range(k.r, 1.05, 1.4);
    const dir = outUp(a, tilt);
    const sl = range(k.r, 0.13, 0.2);
    put(k, g, CYL, k.plain, stalkM(V(0, 0, 0), dir, sl, 0.007), stemColor);
    const top = dir.clone().multiplyScalar(sl);
    const ll = range(k.r, 0.2, 0.26);
    put(k, g, G.chard, k.leaf, leafMatrix(top, outUp(a, tilt - 0.25), UP, ll), vary(k, 0x2f7a39, 0.05));
  }
  return g;
}

export function kale(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.85 + 0.15);
  const stalkH = 0.12;
  put(k, g, CYL, k.plain, stalkM(V(), UP, stalkH, 0.012), 0x6f8f6a);
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39996;
    const h = stalkH * (0.3 + 0.7 * (i / 11));
    const dir = outUp(a, range(k.r, 0.95, 1.3));
    const ll = range(k.r, 0.19, 0.26);
    put(k, g, G.kale, k.leaf, leafMatrix(V(0, h, 0), dir, UP, ll), vary(k, 0x3d6e63, 0.05));
  }
  return g;
}

export function carrot(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, o: { root?: boolean } = {}): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.8 + 0.2);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.28 + jitter(k.r, 0.3);
    const dir = outUp(a, range(k.r, 1.0, 1.4));
    const sl = range(k.r, 0.08, 0.12);
    put(k, g, CYL, k.plain, stalkM(V(), dir, sl, 0.002), 0x5aa63f);
    put(k, g, G.pinnate, k.leaf, leafMatrix(dir.clone().multiplyScalar(sl), outUp(a, 0.9), UP, range(k.r, 0.12, 0.16)), vary(k, 0x4fae3f, 0.06));
  }
  // Orange shoulder at the surface, or the whole root for the cutaway.
  const len = o.root ? 0.16 : 0.018;
  put(k, g, ROOT, k.plain, ballM(V(0, 0.008, 0), 0.016, len, 0.016), 0xff7a1a);
  return g;
}

export function strawberry(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.28 + jitter(k.r, 0.4);
    const dir = outUp(a, range(k.r, 0.8, 1.2));
    const sl = range(k.r, 0.07, 0.11);
    put(k, g, CYL, k.plain, stalkM(V(), dir, sl, 0.0025), 0x6c9a3a);
    const top = dir.clone().multiplyScalar(sl);
    for (let j = -1; j <= 1; j++) put(k, g, G.tooth, k.leaf, leafMatrix(top, outUp(a + j * 0.75, 0.35), UP, 0.055), vary(k, 0x3f8f3a, 0.05));
  }
  const fruits = k.season === 'spring' ? 1 : 3;
  for (let i = 0; i < fruits; i++) {
    const a = k.r() * 6.28;
    const fp = V(Math.cos(a) * 0.09, 0.025, Math.sin(a) * 0.09);
    put(k, g, BERRY, k.shiny, ballM(fp, 0.022), i === 0 && k.season === 'spring' ? 0xf1f5c4 : 0xe3262e);
    put(k, g, flowerGeo(6, 0.3, 0.1, 0.4), k.plain, faceM(fp.clone().add(V(0, 0.003, 0)), UP, 0.014), 0x3f8f3a);
  }
  const flowers = k.season === 'fall' ? 0 : 3;
  for (let i = 0; i < flowers; i++) {
    const a = k.r() * 6.28;
    const fp = V(Math.cos(a) * 0.06, 0.08, Math.sin(a) * 0.06);
    put(k, g, flowerGeo(5, 0.2, 0.15), k.plain, faceM(fp, outUp(a, 0.9), 0.016), 0xffffff);
    put(k, g, SPHERE, k.plain, ballM(fp.clone().add(outUp(a, 0.9).multiplyScalar(0.004)), 0.005), 0xffd23f, null);
  }
  return g;
}

export function cabbage(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.8 + 0.2);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39996;
    put(k, g, G.roundInner, k.leaf, leafMatrix(V(0, 0.01, 0), outUp(a, range(k.r, 0.45, 0.75)), UP, range(k.r, 0.17, 0.21)), vary(k, 0x6f9f92, 0.05));
  }
  if (k.season !== 'spring') {
    put(k, g, SPHERE, k.leaf, ballM(V(0, 0.085, 0), 0.085, 0.075, 0.085), 0xb8d8b0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.28;
      put(k, g, G.roundInner, k.leaf, leafMatrix(V(Math.cos(a) * 0.05, 0.02, Math.sin(a) * 0.05), outUp(a, 1.35), V(-Math.cos(a), 0.2, -Math.sin(a)), 0.13), vary(k, 0x8fbfa6, 0.04));
    }
  }
  return g;
}

// ---------- fruiting annuals ----------

export function tomato(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, o: { cage?: boolean; cageMat?: THREE.Material } = {}): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const H = k.season === 'spring' ? 0.32 : k.season === 'summer' ? 0.95 : 0.9;
  const stemMat = k.stem(0x5d8f3a);
  // Main stem plus two side shoots.
  const stems: THREE.Vector3[][] = [];
  const main = [V(0, 0, 0), V(jitter(k.r, 0.03), H * 0.4, jitter(k.r, 0.03)), V(jitter(k.r, 0.05), H * 0.75, jitter(k.r, 0.05)), V(jitter(k.r, 0.04), H, jitter(k.r, 0.04))];
  stems.push(main);
  for (let s = 0; s < (k.season === 'spring' ? 0 : 2); s++) {
    const a = s * 3.1 + k.r();
    const from = main[1].clone();
    stems.push([from, from.clone().add(outUp(a, 0.9).multiplyScalar(0.18)), from.clone().add(outUp(a, 1.2).multiplyScalar(0.42))]);
  }
  for (const pts of stems) {
    tube(pts, 0.007, stemMat, g, { wind: WIND, taper: 0.4 });
    const curve = new THREE.CatmullRomCurve3(pts);
    const len = curve.getLength();
    const count = Math.max(3, Math.round(len / 0.09));
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 0.5);
      const at = curve.getPointAt(t);
      const a = i * 2.2 + k.r();
      const rach = outUp(a, range(k.r, -0.1, 0.35));
      const rl = range(k.r, 0.14, 0.2) * (k.season === 'spring' ? 0.7 : 1);
      put(k, g, CYL, k.plain, stalkM(at, rach, rl, 0.0025), 0x5d8f3a);
      // Leaflets in pairs along the rachis, one at the tip.
      for (let j = 1; j <= 3; j++) {
        const q = at.clone().addScaledVector(rach, rl * (j / 3.2));
        const sz = 0.055 + 0.01 * j;
        for (const side of [-1, 1]) {
          const d = rach.clone().applyAxisAngle(UP, side * 1.0).add(V(0, -0.2, 0));
          put(k, g, G.ovateSerrate, k.leaf, leafMatrix(q, d, UP, sz), vary(k, 0x3b7d33, 0.05));
        }
      }
      put(k, g, G.ovateSerrate, k.leaf, leafMatrix(at.clone().addScaledVector(rach, rl), rach.clone().add(V(0, -0.15, 0)), UP, 0.075), vary(k, 0x3b7d33, 0.05));
    }
  }
  // Trusses of fruit.
  if (k.season !== 'spring') {
    const clusters = k.season === 'summer' ? 4 : 3;
    for (let c = 0; c < clusters; c++) {
      const a = c * 1.9 + k.r();
      const h = H * range(k.r, 0.3, 0.75);
      const base = V(Math.cos(a) * 0.09, h, Math.sin(a) * 0.09);
      const n = 2 + Math.floor(k.r() * 3);
      for (let i = 0; i < n; i++) {
        const fp = base.clone().add(V(jitter(k.r, 0.035), -0.03 - i * 0.022, jitter(k.r, 0.035)));
        const ripe = k.r();
        const col = ripe > 0.45 ? 0xe8352b : ripe > 0.25 ? 0xff8a2a : 0x9ccc3a;
        const r = range(k.r, 0.024, 0.032);
        put(k, g, SPHERE, k.shiny, ballM(fp, r, r * 0.85, r), col);
        put(k, g, flowerGeo(5, 0.2, 0.3, 1.2), k.plain, faceM(fp.clone().add(V(0, r * 0.82, 0)), UP, r * 0.6, k.r() * 6), 0x3f7a2f, null);
      }
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const fp = V(jitter(k.r, 0.06), H * range(k.r, 0.6, 0.95), jitter(k.r, 0.06));
      put(k, g, flowerGeo(5, 0.25, -0.2, 0.5), k.plain, faceM(fp, V(0, -1, 0.3), 0.014), 0xffd21f);
    }
  }
  if (o.cage && o.cageMat) {
    const ch = 0.95;
    for (const [y, r] of [[0.32, 0.17], [0.62, 0.2], [ch, 0.23]] as const) {
      const ring = add(new THREE.TorusGeometry(r, 0.004, 5, 28), o.cageMat, g, [0, y, 0], { rot: [Math.PI / 2, 0, 0], ink: null });
      ring.castShadow = false;
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 6.28 + 0.4;
      tube([V(Math.cos(a) * 0.15, -0.1, Math.sin(a) * 0.15), V(Math.cos(a) * 0.23, ch, Math.sin(a) * 0.23)], 0.004, o.cageMat, g, { ink: null, seg: 2, radial: 4 });
    }
  }
  return g;
}

export function basil(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.7 + 0.3);
  for (let s = 0; s < 6; s++) {
    const a = s * 1.05 + jitter(k.r, 0.3);
    const top = outUp(a, s === 0 ? 1.5 : 1.15).multiplyScalar(range(k.r, 0.18, 0.26));
    put(k, g, CYL, k.plain, stalkM(V(), top, top.length(), 0.004), 0x6aa84f);
    for (let i = 1; i <= 5; i++) {
      const at = top.clone().multiplyScalar(i / 5.2);
      const sz = 0.085 - i * 0.008;
      for (const side of [0, Math.PI]) {
        const d = outUp(a + side + i * 1.57, 0.5);
        put(k, g, G.ovateCup, k.leaf, leafMatrix(at, d, UP, sz), vary(k, 0x58c43f, 0.05));
      }
    }
    if (k.season === 'fall') put(k, g, CYL, k.plain, stalkM(top, UP, 0.05, 0.006), 0xf4f0ff);
  }
  return g;
}

export function marigold(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, color = 0xffa21f): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.39996;
    put(k, g, G.pinnate, k.leaf, leafMatrix(V(0, 0.02, 0), outUp(a, range(k.r, 0.5, 1.2)), UP, range(k.r, 0.09, 0.13)), vary(k, 0x3a7a32, 0.05));
  }
  const n = k.season === 'spring' ? 2 : 6;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const fp = V(Math.cos(a) * 0.05, range(k.r, 0.12, 0.17), Math.sin(a) * 0.05);
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.003), 0x4f8a3a);
    put(k, g, POM, k.plain, ballM(fp, 0.032), i % 3 === 0 ? 0xff6a00 : color, 'body');
  }
  return g;
}

export function nasturtium(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 10; i++) {
    const a = i * 2.39996;
    const at = outUp(a, range(k.r, 0.3, 0.9)).multiplyScalar(range(k.r, 0.06, 0.14));
    put(k, g, CYL, k.plain, stalkM(V(), at, at.length(), 0.002), 0x7fb04a);
    put(k, g, DISC, k.plain, faceM(at, V(jitter(k.r, 0.3), 1, jitter(k.r, 0.3)), range(k.r, 0.04, 0.055)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), vary(k, 0x7cc04a, 0.05));
  }
  for (let i = 0; i < (k.season === 'spring' ? 1 : 4); i++) {
    const a = k.r() * 6.28;
    const fp = V(Math.cos(a) * 0.1, 0.09, Math.sin(a) * 0.1);
    put(k, g, flowerGeo(5, 0.3, 0.25, 0.5), k.plain, faceM(fp, outUp(a, 0.8), 0.04), i % 2 ? 0xff4a1f : 0xffb21a, 'body');
  }
  return g;
}

/** Corn with optional pole beans twining up it (the Three Sisters). */
export function corn(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, o: { beans?: boolean } = {}): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const fall = k.season === 'fall';
  const H = k.season === 'spring' ? 0.55 : range(k.r, 1.75, 2.0);
  const green = fall ? 0xc9b36a : 0x69ab3c;
  tube([V(0, 0, 0), V(jitter(k.r, 0.02), H * 0.5, jitter(k.r, 0.02)), V(jitter(k.r, 0.03), H, jitter(k.r, 0.03))], 0.016, k.stem(fall ? 0xb59c58 : 0x7fb048), g, { wind: WIND, taper: 0.55 });
  // Shortish leaves held up along the stalk, as in a real cornfield.
  const leaves = k.season === 'spring' ? 5 : 13;
  for (let i = 0; i < leaves; i++) {
    const h = H * (0.06 + 0.78 * (i / leaves));
    const a = i * Math.PI + i * 0.35 + jitter(k.r, 0.6);
    const len = (k.season === 'spring' ? 0.28 : 0.46) * (1 - 0.4 * Math.abs(i / leaves - 0.4));
    put(k, g, CORN_LEAF, k.leaf, leafMatrix(V(0, h, 0), outUp(a, range(k.r, 1.0, 1.25)), UP, len), vary(k, green, 0.05));
  }
  if (k.season !== 'spring') {
    // Tassel.
    for (let i = 0; i < 10; i++) {
      put(k, g, CYL, k.plain, stalkM(V(0, H - (i ? 0.03 : 0), 0), outUp(i * 0.7, i === 0 ? 1.57 : range(k.r, 1.0, 1.3)), i === 0 ? 0.24 : 0.17, 0.004), fall ? 0xa98a4a : 0xe2d48a, null);
    }
    // Ears in husks with silk.
    for (let e = 0; e < 2; e++) {
      const a = e * 2.6 + k.r();
      const at = V(Math.cos(a) * 0.035, H * (0.42 + e * 0.12), Math.sin(a) * 0.035);
      const d = outUp(a, 1.2);
      put(k, g, CAPSULE, k.leaf, leafMatrix(at.clone().addScaledVector(d, 0.08), d, UP, 0.028, 0.045, 0.028), fall ? 0xd9c27a : 0x9cc864, 'body');
      put(k, g, CYL, k.plain, stalkM(at.clone().addScaledVector(d, 0.165), d.clone().add(V(0, -0.6, 0)), 0.05, 0.006), 0xb7743a, null);
    }
  }
  if (o.beans) poleBean(k, g, H);
  return g;
}

function poleBean(k: PlantKit, g: THREE.Object3D, H: number): void {
  const fall = k.season === 'fall';
  const top = H * (k.season === 'spring' ? 0.6 : 0.88);
  const turns = 4.5;
  const pts: THREE.Vector3[] = [];
  const phase = k.r() * 6.28;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = phase + t * turns * Math.PI * 2;
    const rr = 0.026 - t * 0.008;
    pts.push(V(Math.cos(a) * rr, t * top, Math.sin(a) * rr));
  }
  tube(pts, 0.0035, k.stem(fall ? 0x9f9356 : 0x5e9a3c), g, { wind: WIND, seg: 80, radial: 4 });
  const curve = new THREE.CatmullRomCurve3(pts);
  const n = k.season === 'spring' ? 6 : 14;
  for (let i = 1; i <= n; i++) {
    const at = curve.getPointAt(i / (n + 1));
    const a = Math.atan2(at.z, at.x);
    const d = outUp(a, 0.2);
    const sl = 0.05;
    const tip = at.clone().addScaledVector(d, sl);
    put(k, g, CYL, k.plain, stalkM(at, d, sl, 0.002), 0x5e9a3c);
    for (let j = -1; j <= 1; j++) {
      put(k, g, G.heart, k.leaf, leafMatrix(tip, outUp(a + j * 0.9, -0.35 + (j === 0 ? 0.3 : 0)), V(Math.cos(a), 0.6, Math.sin(a)), 0.07), vary(k, fall ? 0xb8a85a : 0x4f9a3a, 0.05));
    }
    if (k.season !== 'spring' && i % 2 === 0) {
      const pod = at.clone().addScaledVector(d, 0.03).add(V(0, -0.06, 0));
      put(k, g, CAPSULE, k.plain, leafMatrix(pod, V(jitter(k.r, 0.2), 1, jitter(k.r, 0.2)), V(1, 0, 0), 0.0055, 0.03, 0.0055), fall ? 0xc4a868 : 0x6cc03f);
    }
    if (k.season === 'summer' && i % 3 === 1) put(k, g, flowerGeo(5, 0.3, 0.3), k.plain, faceM(at.clone().addScaledVector(d, 0.02), d, 0.01), 0xe7d8ff);
  }
}

export function squash(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, dirs: number[]): THREE.Group {
  const g = plantGroup(parent, p);
  const fall = k.season === 'fall';
  const len = k.season === 'spring' ? 0.25 : 0.85;
  for (const a of dirs) {
    const pts = [V(0, 0.02, 0), V(Math.cos(a) * len * 0.5, 0.05, Math.sin(a) * len * 0.5 + jitter(k.r, 0.1)), V(Math.cos(a + 0.3) * len, 0.03, Math.sin(a + 0.3) * len)];
    tube(pts, 0.012, k.stem(fall ? 0x9b9a4e : 0x6aa13e), g, { wind: WIND });
    const curve = new THREE.CatmullRomCurve3(pts);
    const n = k.season === 'spring' ? 2 : 5;
    for (let i = 0; i < n; i++) {
      const at = curve.getPointAt((i + 0.5) / n);
      const ph = range(k.r, 0.2, 0.32) * (k.season === 'spring' ? 0.6 : 1);
      const top = at.clone().add(V(jitter(k.r, 0.05), ph, jitter(k.r, 0.05)));
      put(k, g, CYL, k.plain, stalkM(at, top.clone().sub(at), ph, 0.006), 0x7aa84a);
      const yellow = fall && k.r() > 0.5;
      put(k, g, G.palmate, k.leaf, leafMatrix(top.clone().add(V(0, -0.02, 0)), outUp(a + jitter(k.r, 1.2), 0.15), V(jitter(k.r, 0.3), 1, 0.4), range(k.r, 0.36, 0.46) * (k.season === 'spring' ? 0.55 : 1)), yellow ? 0xb6aa4a : vary(k, 0x4a8d38, 0.05));
    }
    if (k.season === 'summer') {
      const fp = curve.getPointAt(0.55).add(V(0, 0.06, 0));
      put(k, g, flowerGeo(5, 0.35, 0.6, 0.8), k.plain, faceM(fp, V(Math.cos(a), 1, Math.sin(a)), 0.05), 0xffc21a, 'body');
    }
    if (k.season !== 'spring') {
      const fp = curve.getPointAt(fall ? 0.75 : 0.85);
      const r = fall ? range(k.r, 0.15, 0.19) : 0.09;
      put(k, g, PUMPKIN, k.shiny, ballM(fp.clone().add(V(0, r * 0.68, 0)), r), fall ? 0xf28a22 : 0x7fa83a, 'body');
      put(k, g, CYL, k.plain, stalkM(fp.clone().add(V(0, r * 1.3, 0)), V(0.3, 1, 0), 0.05, 0.012), 0x6b5a2a);
    }
  }
  return g;
}

export function sunflower(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, facing: number): THREE.Group {
  const g = plantGroup(parent, p, 0);
  const H = k.season === 'spring' ? 0.6 : range(k.r, 1.7, 2.1);
  const top = V(jitter(k.r, 0.05), H, jitter(k.r, 0.05));
  tube([V(0, 0, 0), V(0, H * 0.5, 0), top], 0.016, k.stem(k.season === 'fall' ? 0x8f8a45 : 0x5f9a38), g, { wind: WIND, taper: 0.5 });
  const leaves = k.season === 'spring' ? 5 : 9;
  for (let i = 0; i < leaves; i++) {
    const h = H * (0.12 + 0.75 * (i / leaves));
    const a = i * 2.39996;
    const sl = 0.06;
    const d = outUp(a, 0.4);
    put(k, g, CYL, k.plain, stalkM(V(0, h, 0), d, sl, 0.004), 0x5f9a38);
    const size = (0.34 - 0.14 * (i / leaves)) * (k.season === 'spring' ? 0.7 : 1);
    const droop = k.season === 'fall' ? -0.9 : -0.25;
    put(k, g, G.heartTooth, k.leaf, leafMatrix(V(0, h, 0).addScaledVector(d, sl), outUp(a, droop), UP, size), k.season === 'fall' && i < 4 ? 0xa59a46 : vary(k, 0x55993a, 0.05));
  }
  if (k.season === 'spring') return g;
  // Head: textured seed disc, petals in two rows, green back.
  const droop = k.season === 'fall' ? 1.1 : 0.25;
  const face = V(Math.cos(facing) * Math.cos(droop), Math.sin(-droop) * 0.6 + 0.25, Math.sin(facing) * Math.cos(droop)).normalize();
  const center = top.clone().addScaledVector(face, 0.03);
  const head = add(DISC, k.seedHead, g, [center.x, center.y, center.z], { wind: WIND });
  head.quaternion.setFromUnitVectors(UP, face);
  head.scale.set(0.11, 0.5, 0.11);
  const petals = k.season === 'fall' ? 10 : 22;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const X = new THREE.Vector3().crossVectors(UP, face).normalize();
    const Y = new THREE.Vector3().crossVectors(face, X);
    const d = X.clone().multiplyScalar(Math.cos(a)).addScaledVector(Y, Math.sin(a));
    const base = center.clone().addScaledVector(d, 0.1).addScaledVector(face, -0.004 - (i % 2) * 0.004);
    put(k, g, G.petal, k.plain, leafMatrix(base, d.clone().addScaledVector(face, -0.15), face, 0.085), k.season === 'fall' ? 0xc8902a : i % 2 ? 0xffc21a : 0xffd84a);
  }
  return g;
}

// ---------- fruit trees and shrubs ----------

export function pawpaw(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const s = k.season;
  const H = 3.1;
  const bark = k.stem(0x6b5b55);
  tube([V(0, 0, 0), V(0.03, H * 0.4, 0), V(-0.02, H * 0.75, 0.02), V(0, H, 0)], 0.075, bark, g, { wind: WIND, taper: 0.75, radial: 8 });
  const leafCol = s === 'fall' ? 0xf0c43a : s === 'spring' ? 0x86c45a : 0x3f8b3a;
  const tiers = [[0.95, 4, 1.15], [1.45, 4, 1.0], [1.95, 4, 0.82], [2.45, 3, 0.6], [2.85, 3, 0.4]] as const;
  let bi = 0;
  for (const [h, n, len] of tiers) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + bi * 0.7 + jitter(k.r, 0.25);
      bi++;
      const start = V(0, h, 0);
      const mid = start.clone().add(outUp(a, 0.42).multiplyScalar(len * 0.55));
      const end = start.clone().add(outUp(a, 0.12).multiplyScalar(len));
      tube([start, mid, end], 0.026 * len + 0.006, bark, g, { wind: WIND, taper: 0.7, radial: 6 });
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const leaves = s === 'spring' ? 6 : 14;
      for (let j = 0; j < leaves; j++) {
        const t = 0.35 + 0.65 * (j / leaves);
        const at = curve.getPointAt(t);
        const side = j % 2 ? 1 : -1;
        const d = outUp(a + side * range(k.r, 0.6, 1.1), range(k.r, -0.8, -0.25));
        const size = (s === 'spring' ? 0.14 : 0.28) * range(k.r, 0.8, 1.1);
        put(k, g, G.obovate, k.leaf, leafMatrix(at, d, UP, size), vary(k, leafCol, 0.06), 'body');
      }
      if (s === 'spring') {
        // Maroon, three-petalled bells hang along bare wood before the leaves fill in.
        for (let j = 0; j < 3; j++) {
          const at = curve.getPointAt(0.3 + j * 0.2).add(V(0, -0.03, 0));
          put(k, g, flowerGeo(6, 0.35, -0.5, 0.9), k.plain, faceM(at, V(0, -1, 0.2), 0.035, k.r() * 6), 0x6e1a2a, 'body');
        }
      } else if (i % 2 === 0 && h < 2.6) {
        // Clusters of mango-shaped fruit.
        const at = curve.getPointAt(0.55);
        const n2 = 2 + Math.floor(k.r() * 3);
        for (let f = 0; f < n2; f++) {
          const fa = (f / n2) * 6.28;
          const fp = at.clone().add(V(Math.cos(fa) * 0.06, -0.2, Math.sin(fa) * 0.06));
          put(k, g, CAPSULE, k.shiny, leafMatrix(fp, V(Math.cos(fa) * 0.4, 1, Math.sin(fa) * 0.4), V(1, 0, 0), 0.05, 0.045, 0.045), s === 'fall' ? 0xc7cf48 : 0x86b83f, 'body');
        }
      }
    }
  }
  return g;
}

export function goji(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const cane = k.stem(0xa89a7a);
  const canes = 9;
  for (let c = 0; c < canes; c++) {
    const a = (c / canes) * 6.28 + jitter(k.r, 0.3);
    const h = range(k.r, 0.9, 1.3) * (k.season === 'spring' ? 0.8 : 1);
    const reach = range(k.r, 0.45, 0.75);
    const pts = [V(0, 0, 0), V(Math.cos(a) * reach * 0.25, h * 0.75, Math.sin(a) * reach * 0.25), V(Math.cos(a) * reach * 0.7, h, Math.sin(a) * reach * 0.7), V(Math.cos(a) * reach, h * 0.7, Math.sin(a) * reach)];
    tube(pts, 0.01, cane, g, { wind: WIND, taper: 0.6, radial: 5 });
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let i = 0; i < 24; i++) {
      const t = 0.2 + 0.8 * (i / 24);
      const at = curve.getPointAt(t);
      for (let j = 0; j < 3; j++) {
        put(k, g, G.lance, k.leaf, leafMatrix(at, outUp(k.r() * 6.28, range(k.r, -0.4, 0.5)), UP, range(k.r, 0.07, 0.095)), vary(k, 0x5c8f4a, 0.06));
      }
      if (t > 0.5 && k.season !== 'spring' && i % (k.season === 'fall' ? 1 : 3) === 0) {
        put(k, g, CAPSULE, k.shiny, leafMatrix(at.clone().add(V(jitter(k.r, 0.03), -0.03, jitter(k.r, 0.03))), V(jitter(k.r, 0.3), 1, jitter(k.r, 0.3)), V(1, 0, 0), 0.011, 0.01, 0.011), 0xff3a1c);
      }
      if (k.season === 'summer' && i % 4 === 1) put(k, g, flowerGeo(5, 0.25, 0.2), k.plain, faceM(at, outUp(k.r() * 6.28, 0.4), 0.012), 0x9358cf);
    }
  }
  return g;
}

export function blueberry(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const wood = k.stem(0x8a5a4a);
  const leafCol = k.season === 'fall' ? 0xc2372b : 0x3b7a4b;
  for (let c = 0; c < 6; c++) {
    const a = (c / 6) * 6.28 + jitter(k.r, 0.3);
    const h = range(k.r, 0.75, 1.0);
    const pts = [V(0, 0, 0), V(Math.cos(a) * 0.12, h * 0.55, Math.sin(a) * 0.12), V(Math.cos(a) * 0.26, h, Math.sin(a) * 0.26)];
    tube(pts, 0.012, wood, g, { wind: WIND, taper: 0.6, radial: 5 });
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let i = 0; i < 48; i++) {
      const t = 0.25 + 0.75 * (i / 48);
      const at = curve.getPointAt(t).add(V(jitter(k.r, 0.16), jitter(k.r, 0.1), jitter(k.r, 0.16)));
      put(k, g, G.ovate, k.leaf, leafMatrix(at, outUp(k.r() * 6.28, range(k.r, -0.2, 0.7)), UP, range(k.r, 0.06, 0.08)), vary(k, leafCol, 0.07));
      if (i % 7 === 3) {
        for (let b = 0; b < 6; b++) {
          const bp = at.clone().add(V(jitter(k.r, 0.025), -0.025 - k.r() * 0.025, jitter(k.r, 0.025)));
          if (k.season === 'spring') put(k, g, CAPSULE, k.plain, ballM(bp, 0.008, 0.008, 0.008), 0xfdf3e3);
          else put(k, g, SPHERE, k.shiny, ballM(bp, 0.013), k.season === 'summer' && b === 5 ? 0xa8c45a : 0x3a4fa8);
        }
      }
    }
  }
  return g;
}

// ---------- herbs ----------

export function lavender(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let i = 0; i < 40; i++) {
    const a = i * 2.39996;
    const at = V(Math.cos(a) * 0.05 * k.r(), 0.01, Math.sin(a) * 0.05 * k.r());
    put(k, g, G.needle, k.leaf, leafMatrix(at, outUp(a, range(k.r, 0.9, 1.4)), UP, range(k.r, 0.08, 0.13)), vary(k, 0x8aa88f, 0.05));
  }
  if (k.season !== 'spring') {
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996;
      const d = outUp(a, range(k.r, 1.15, 1.45));
      const len = range(k.r, 0.22, 0.3);
      put(k, g, CYL, k.plain, stalkM(V(), d, len, 0.0018), 0x9db08a, null);
      put(k, g, CAPSULE, k.plain, leafMatrix(d.clone().multiplyScalar(len), d, UP, 0.008, 0.016, 0.008), k.season === 'fall' ? 0x8a7aa8 : 0x8a63d8);
    }
  }
  return g;
}

export function rosemary(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let s = 0; s < 11; s++) {
    const a = s * 2.39996 + jitter(k.r, 0.3);
    const top = outUp(a, range(k.r, 1.05, 1.4)).multiplyScalar(range(k.r, 0.35, 0.52));
    put(k, g, CYL, k.plain, stalkM(V(), top, top.length(), 0.005), 0x7a6a50);
    for (let i = 0; i < 26; i++) {
      const at = top.clone().multiplyScalar(0.15 + 0.85 * (i / 26));
      put(k, g, G.needle, k.leaf, leafMatrix(at, outUp(i * 2.4, range(k.r, 0.3, 0.9)), UP, 0.065), vary(k, 0x3f6a4a, 0.05));
    }
    if (k.season === 'spring') put(k, g, flowerGeo(5, 0.3, 0.2), k.plain, faceM(top, UP, 0.01), 0x8fb0ff);
  }
  return g;
}

export function sage(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996;
    const sl = range(k.r, 0.04, 0.1);
    const d = outUp(a, range(k.r, 0.7, 1.2));
    put(k, g, CYL, k.plain, stalkM(V(), d, sl, 0.003), 0x8a9a80);
    put(k, g, G.ovate, k.leaf, leafMatrix(d.clone().multiplyScalar(sl), outUp(a, 0.4), UP, range(k.r, 0.065, 0.085)), vary(k, 0x8aa392, 0.04));
  }
  if (k.season === 'summer') {
    for (let i = 0; i < 4; i++) {
      const d = outUp(i * 1.6, 1.35);
      put(k, g, CYL, k.plain, stalkM(V(), d, 0.22, 0.002), 0x8a9a80, null);
      put(k, g, CAPSULE, k.plain, leafMatrix(d.clone().multiplyScalar(0.22), d, UP, 0.008, 0.02, 0.008), 0x9a72d8);
    }
  }
  return g;
}

export function thyme(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, spread = 0.14): THREE.Group {
  const g = plantGroup(parent, p);
  for (let i = 0; i < 160; i++) {
    const a = k.r() * 6.28;
    const r = Math.sqrt(k.r()) * spread;
    const at = V(Math.cos(a) * r, 0.01 + (1 - r / spread) * 0.07 * k.r(), Math.sin(a) * r);
    put(k, g, SPHERE, k.leaf, ballM(at, 0.014, 0.008, 0.01), vary(k, 0x5f7f48, 0.06), i % 4 ? null : 'thin');
    if (k.season === 'summer' && i % 5 === 0) put(k, g, SPHERE, k.plain, ballM(at.clone().add(V(0, 0.012, 0)), 0.008), 0xe7a3d8, null);
  }
  return g;
}

export function chamomile(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996;
    put(k, g, G.pinnate, k.leaf, leafMatrix(V(0, 0.01, 0), outUp(a, range(k.r, 0.9, 1.3)), UP, range(k.r, 0.08, 0.12)), vary(k, 0x78b04a, 0.05));
  }
  const n = k.season === 'spring' ? 3 : 12;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const fp = V(Math.cos(a) * 0.07 * k.r(), range(k.r, 0.2, 0.3), Math.sin(a) * 0.07 * k.r());
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.0015), 0x78b04a, null);
    put(k, g, flowerGeo(13, 0.15, 0.05, 0.5), k.plain, faceM(fp, V(jitter(k.r, 0.4), 1, jitter(k.r, 0.4)), 0.018), 0xffffff, null);
    put(k, g, SPHERE, k.plain, ballM(fp.clone().add(V(0, 0.004, 0)), 0.006, 0.005, 0.006), 0xffd21f, null);
  }
  return g;
}

/** Marshmallow (Althaea officinalis): tall velvety grey-green stems, pale pink flowers up top. */
export function marshmallow(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const H = k.season === 'spring' ? 0.55 : range(k.r, 1.15, 1.35);
  for (let s = 0; s < 4; s++) {
    const a = s * 1.6 + jitter(k.r, 0.4);
    const reach = range(k.r, 0.14, 0.24);
    const pts = [V(0, 0, 0), V(Math.cos(a) * reach * 0.5, H * 0.5, Math.sin(a) * reach * 0.5), V(Math.cos(a) * reach, H * range(k.r, 0.85, 1), Math.sin(a) * reach)];
    tube(pts, 0.005, k.stem(0x88a07f), g, { wind: WIND, taper: 0.5, radial: 5 });
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let i = 0; i < 15; i++) {
      const t = 0.05 + 0.9 * (i / 15);
      const at = curve.getPointAt(t);
      const la = i * 2.39996 + s;
      const size = 0.15 * (1 - 0.5 * t);
      put(k, g, G.heartTooth, k.leaf, leafMatrix(at, outUp(la, -0.2), UP, size), vary(k, 0x9ab596, 0.04));
      if (k.season !== 'spring' && t > 0.55) {
        for (let f = 0; f < 2; f++) {
          const fp = at.clone().add(outUp(la + f * 2, 0.3).multiplyScalar(0.025));
          if (k.season === 'summer') {
            put(k, g, flowerGeo(5, 0.25, 0.25, 0.5), k.plain, faceM(fp, outUp(la + f * 2, 0.5), 0.028), 0xf7cfe0);
            put(k, g, SPHERE, k.plain, ballM(fp.clone().add(outUp(la + f * 2, 0.5).multiplyScalar(0.003)), 0.004), 0xc0567f, null);
          } else {
            put(k, g, POM, k.plain, ballM(fp, 0.008), 0x8f8a6a, null);
          }
        }
      }
    }
  }
  return g;
}

export function chives(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p);
  for (let i = 0; i < 26; i++) {
    const a = k.r() * 6.28;
    const d = outUp(a, range(k.r, 1.25, 1.5));
    const len = range(k.r, 0.18, 0.27);
    put(k, g, CYL, k.plain, stalkM(V(Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02), d, len, 0.0025), vary(k, 0x4f9a3a, 0.05), null);
    if (k.season !== 'fall' && i % 4 === 0) put(k, g, POM, k.plain, ballM(d.clone().multiplyScalar(len), 0.016), 0xc58bd8);
  }
  return g;
}

// ---------- flowers and climbers ----------

export function zinnia(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, color: number): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + k.r();
    const fp = V(Math.cos(a) * 0.05, range(k.r, 0.4, 0.55), Math.sin(a) * 0.05);
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.003), 0x5f9a3a, null);
    for (let j = 0; j < 3; j++) put(k, g, G.lance, k.leaf, leafMatrix(fp.clone().multiplyScalar(0.25 + j * 0.2), outUp(a + j * 2.1, 0.2), UP, 0.07), vary(k, 0x4f8f3a, 0.05));
    if (k.season === 'spring') continue;
    const face = V(jitter(k.r, 0.3), 1, jitter(k.r, 0.3) + 0.4);
    put(k, g, flowerGeo(14, 0.3, 0.1, 0.7), k.plain, faceM(fp, face, 0.058), color, 'body');
    put(k, g, flowerGeo(11, 0.3, 0.3, 0.7), k.plain, faceM(fp.clone().addScaledVector(face.normalize(), 0.007), face, 0.04, 0.3), new THREE.Color(color).offsetHSL(0, 0, 0.08));
    put(k, g, SPHERE, k.plain, ballM(fp.clone().addScaledVector(face, 0.012), 0.009), 0xffd21f, null);
  }
  return g;
}

export function cosmos(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, color: number): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + k.r();
    const fp = V(Math.cos(a) * 0.12, range(k.r, 0.6, 0.85), Math.sin(a) * 0.12);
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.0022), 0x6aa84a, null);
    put(k, g, G.pinnate, k.leaf, leafMatrix(fp.clone().multiplyScalar(0.4), outUp(a, 0.6), UP, 0.09), vary(k, 0x5fa83f, 0.05));
    if (k.season === 'spring') continue;
    const face = V(jitter(k.r, 0.4), 1, jitter(k.r, 0.4) + 0.5);
    put(k, g, flowerGeo(8, 0.12, 0.08, 0.35), k.plain, faceM(fp, face, 0.042), color);
    put(k, g, SPHERE, k.plain, ballM(fp.clone().addScaledVector(face.normalize(), 0.004), 0.008), 0xffc21a, null);
  }
  return g;
}

/** Coneflower: drooping pink petals around a spiky orange-brown cone. */
export function echinacea(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, color = 0xe06aa8): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 6; i++) put(k, g, G.lance, k.leaf, leafMatrix(V(0, 0.02, 0), outUp(i * 2.39996, range(k.r, 0.3, 0.7)), UP, range(k.r, 0.1, 0.14)), vary(k, 0x3f7a34, 0.05));
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + k.r();
    const fp = V(Math.cos(a) * 0.07, range(k.r, 0.5, 0.68), Math.sin(a) * 0.07);
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.003), 0x4f7f34, null);
    put(k, g, G.lance, k.leaf, leafMatrix(fp.clone().multiplyScalar(0.45), outUp(a + 1, 0.3), UP, 0.07), vary(k, 0x3f7a34, 0.05));
    if (k.season === 'spring') continue;
    const face = V(jitter(k.r, 0.3), 1, jitter(k.r, 0.3) + 0.35);
    put(k, g, flowerGeo(13, 0.22, -0.55, 0.45), k.plain, faceM(fp, face, 0.06, k.r() * 6), k.season === 'fall' ? mix(color, 0x8a6a5a, 0.5) : vary(k, color, 0.05), 'body');
    put(k, g, POM, k.plain, ballM(fp.clone().addScaledVector(face.normalize(), 0.012), 0.022, 0.02, 0.022), 0xb0521a, null);
  }
  return g;
}

/** Bee balm: square stems topped with shaggy scarlet or purple heads. */
export function beeBalm(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, color = 0xe0283f): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + k.r();
    const fp = V(Math.cos(a) * 0.09, range(k.r, 0.55, 0.75), Math.sin(a) * 0.09);
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.0035), 0x4a7a36, null);
    for (let j = 0; j < 3; j++) {
      const at = fp.clone().multiplyScalar(0.25 + j * 0.22);
      for (const side of [0, Math.PI]) put(k, g, G.lance, k.leaf, leafMatrix(at, outUp(a + side + j * 1.57, 0.15), UP, 0.06), vary(k, 0x46803a, 0.05));
    }
    if (k.season === 'spring') continue;
    const c = k.season === 'fall' ? mix(color, 0x7a5a4a, 0.55) : vary(k, color, 0.05);
    put(k, g, flowerGeo(16, 0.15, 0.9, 0.3), k.plain, faceM(fp, UP, 0.05, k.r() * 6), c, 'body');
    put(k, g, POM, k.plain, ballM(fp.clone().add(V(0, 0.012, 0)), 0.024), c, null);
  }
  return g;
}

/** Sweet alyssum: a low cushion of tiny white flowers for the bed edge. */
export function alyssum(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.5 + 0.5);
  put(k, g, POM, k.plain, ballM(V(0, 0.02, 0), 0.11, 0.035, 0.11), 0x4f8a3a, null);
  const n = k.season === 'spring' ? 10 : 26;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const d = Math.sqrt((i + 0.5) / n) * 0.12;
    put(k, g, POM, k.plain, ballM(V(Math.cos(a) * d, 0.055 - d * 0.22, Math.sin(a) * d), 0.03, 0.022, 0.03), i % 6 ? 0xfafaf2 : 0xe2c8f0, i % 3 ? null : 'thin');
  }
  return g;
}

/** Leafy, flowering vine along a path: roses on the arbor, clematis on the fence. */
export function climber(k: PlantKit, parent: THREE.Object3D, path: THREE.Vector3[], o: { leaf: number; flowers: number[]; petals: number; flowerSize: number; density?: number; leafSize?: number; geo?: THREE.BufferGeometry }): void {
  const g = plantGroup(parent, V());
  tube(path, 0.009, k.stem(0x5a6a3a), g, { wind: WIND, radial: 5 });
  const curve = new THREE.CatmullRomCurve3(path);
  const n = Math.round(curve.getLength() * (o.density ?? 40));
  for (let i = 0; i < n; i++) {
    const at = curve.getPointAt(i / n).add(V(jitter(k.r, 0.08), jitter(k.r, 0.08), jitter(k.r, 0.08)));
    put(k, g, o.geo ?? G.tooth, k.leaf, leafMatrix(at, outUp(k.r() * 6.28, range(k.r, -0.6, 0.6)), V(jitter(k.r, 1), 0.6, 1), (o.leafSize ?? 0.06) * range(k.r, 0.8, 1.2)), vary(k, o.leaf, 0.06));
    const bloom = k.season === 'fall' ? 0.08 : k.season === 'spring' ? 0.12 : 0.3;
    if (k.r() < bloom) {
      const col = o.flowers[Math.floor(k.r() * o.flowers.length)];
      const face = V(jitter(k.r, 0.6), jitter(k.r, 0.4), 1).add(V(0, 0.2, 0));
      put(k, g, flowerGeo(o.petals, 0.25, 0.3, 0.5), k.plain, faceM(at, face, o.flowerSize, k.r() * 6), col, 'body');
      put(k, g, flowerGeo(o.petals, 0.3, 0.5, 0.6), k.plain, faceM(at.clone().addScaledVector(face.normalize(), 0.006), face, o.flowerSize * 0.6, k.r() * 6), new THREE.Color(col).offsetHSL(0, 0.05, -0.06), null);
    }
  }
}

/** Grass tuft: a few blades merged into one geometry, scattered with instancing. */
export const TUFT = (() => {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28;
    const m = leafMatrix(V(Math.cos(a) * 0.01, 0, Math.sin(a) * 0.01), outUp(a, 1.15 + (i % 2) * 0.2), UP, 0.1 + (i % 3) * 0.02);
    parts.push(G.blade.clone().applyMatrix4(m));
  }
  const merged = new THREE.BufferGeometry();
  // Simple merge (all parts share attributes).
  const pos: number[] = [];
  const nor: number[] = [];
  for (const p of parts) {
    const ng = p.index ? p.toNonIndexed() : p;
    pos.push(...(ng.getAttribute('position').array as Float32Array));
    nor.push(...(ng.getAttribute('normal').array as Float32Array));
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return merged;
})();

export { CYL, SPHERE, CAPSULE, POM, PUMPKIN, put, faceM, ballM, stalkM, outUp, vary, G as LEAVES };
export type { LeafOpts };
