/** Modelling helpers shared by the rigs. Instance batches let hundreds of leaves cost a handful of draw calls. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { outlineX, toon, type InkWeight, type ToonOpts } from '../toon';
import { PALETTE } from '../theme';

export type V3 = [number, number, number];

/** Sway strength shared by every plant material, so stems, leaves and fruit move together. */
export const WIND = 0.008;


/** Small seeded PRNG (mulberry32) so the garden looks the same on every load. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const range = (r: () => number, a: number, b: number) => a + (b - a) * r();
export const jitter = (r: () => number, amt: number) => (r() * 2 - 1) * amt;


export function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number], anisotropy = 4): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** White leaf with a darker midrib and veins; instance colour tints it. */
export function leafTexture(veins = 6, rib = 0.16): THREE.CanvasTexture {
  return canvasTex(64, 128, (ctx) => {
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, '#d9d9d9');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 128);
    ctx.strokeStyle = `rgba(40,30,40,${rib + 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(32, 128);
    ctx.lineTo(32, 4);
    ctx.stroke();
    ctx.strokeStyle = `rgba(40,30,40,${rib})`;
    ctx.lineWidth = 1.6;
    for (let i = 1; i <= veins; i++) {
      const y = 128 - (i / (veins + 1)) * 124;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.quadraticCurveTo(32 + side * 14, y - 8, 32 + side * 30, y - 22);
        ctx.stroke();
      }
    }
  });
}

/** Wood planks: warm base with darker grain lines along u. */
export function woodTexture(base = '#b9844f', grain = '#8a5a32', repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  return canvasTex(128, 64, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 64);
    const r = rng(7);
    ctx.strokeStyle = grain;
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = 0.25 + r() * 0.35;
      ctx.lineWidth = 1 + r() * 1.5;
      const y = r() * 64;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(40, y + jitter(r, 4), 90, y + jitter(r, 4), 128, y + jitter(r, 3));
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = grain;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse(20 + r() * 90, 10 + r() * 44, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat);
}

/** Speckled ground: soil, mulch, gravel. */
export function speckle(base: string, flecks: string[], n: number, size: [number, number], repeat: [number, number], seed = 3): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = flecks[Math.floor(r() * flecks.length)];
      const w = range(r, size[0], size[1]);
      ctx.save();
      ctx.translate(r() * 128, r() * 128);
      ctx.rotate(r() * Math.PI);
      ctx.fillRect(-w / 2, -w / 4, w, w / 2);
      ctx.restore();
    }
  }, repeat);
}

export function label(lines: { text: string; size: number; color?: string; weight?: number }[], bg: string, w = 256, h = 128, anisotropy = 4): THREE.CanvasTexture {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const total = lines.reduce((s, l) => s + l.size * 1.15, 0);
    let y = (h - total) / 2;
    for (const l of lines) {
      ctx.font = `${l.weight ?? 800} ${l.size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = l.color ?? PALETTE.ink;
      ctx.fillText(l.text, w / 2, y);
      y += l.size * 1.15;
    }
  }, undefined, anisotropy);
}

export function mapped(color: THREE.ColorRepresentation, map: THREE.Texture, o: ToonOpts = {}): THREE.MeshToonMaterial {
  const m = toon(color, o);
  m.map = map;
  return m;
}


export type LeafShape = 'ovate' | 'obovate' | 'lance' | 'round' | 'heart' | 'strap' | 'pinnate' | 'palmate' | 'petal' | 'blade';

export interface LeafOpts {
  shape: LeafShape;
  /** Half-width relative to a length of 1. */
  w?: number;
  /** Serrations along the edge: count per side and depth. */
  teeth?: number;
  toothDepth?: number;
  /** Ruffled edge (lettuce). */
  wave?: number;
  /** Curl along the length: positive bends the tip toward -z (the back). */
  bend?: number;
  /** V-fold across the midrib. */
  fold?: number;
  /** Cup the leaf: edges curl toward +z. */
  cup?: number;
  /** Frilly edge: the rim flutters up and down (kale, lettuce). */
  ruffle?: number;
  ruffleFreq?: number;
  thickness?: number;
  segments?: number;
}

function profile(shape: LeafShape, t: number, w: number): number {
  switch (shape) {
    case 'ovate': return w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.85);
    case 'obovate': return w * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.5)), 0.8);
    case 'lance': return w * Math.pow(Math.sin(Math.PI * t), 1.1) * (1 - 0.3 * t);
    case 'round': return w * Math.sqrt(Math.max(0, t * (1 - t))) * 2;
    case 'heart': return w * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t)), 0.8);
    case 'strap': return w * (1 - Math.pow(t, 3)) * Math.min(1, t * 12 + 0.4);
    case 'pinnate': return w * Math.pow(Math.sin(Math.PI * t), 0.7) * (0.12 + 0.88 * Math.pow(Math.abs(Math.sin(t * Math.PI * 7)), 1.4));
    case 'petal': return w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.7);
    case 'blade': return w * (1 - t) * Math.min(1, t * 8 + 0.3);
    default: return w * Math.sin(Math.PI * t);
  }
}

const leafCache = new Map<string, THREE.BufferGeometry>();

/**
 * A thin, closed leaf (so ink hulls work): base at the origin, tip at +y = 1,
 * width along x, face toward +z. Scale it per instance.
 */
export function leafGeo(o: LeafOpts): THREE.BufferGeometry {
  const key = JSON.stringify(o);
  const hit = leafCache.get(key);
  if (hit) return hit;
  const w = o.w ?? 0.4;
  const seg = o.segments ?? 14;
  const pts: THREE.Vector2[] = [];

  if (o.shape === 'palmate') {
    // Five-lobed squash leaf around the stem point.
    const n = 44;
    for (let i = 0; i <= n; i++) {
      const phi = -Math.PI + 0.32 + (i / n) * (2 * Math.PI - 0.64);
      let r = 0.5 * (0.66 + 0.34 * Math.pow(Math.abs(Math.cos((5 * phi) / 2)), 0.7));
      if (o.teeth) r *= 1 - (o.toothDepth ?? 0.04) * (0.5 + 0.5 * Math.cos(phi * o.teeth * 5));
      pts.push(new THREE.Vector2(r * Math.sin(phi), 0.5 + r * Math.cos(phi)));
    }
    pts.push(new THREE.Vector2(0, 0.42));
  } else {
    const left: THREE.Vector2[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      let hw = profile(o.shape, t, w);
      if (o.teeth && t > 0.08 && t < 0.97) {
        const k = (t * o.teeth) % 1;
        hw *= 1 - (o.toothDepth ?? 0.12) * (k < 0.5 ? k * 2 : (1 - k) * 2);
      }
      if (o.wave) hw *= 1 + o.wave * Math.sin(t * Math.PI * 7);
      left.push(new THREE.Vector2(-hw, t));
    }
    if (o.shape === 'heart') pts.push(new THREE.Vector2(0, 0.1));
    pts.push(...left);
    for (let i = left.length - 2; i >= 0; i--) pts.push(new THREE.Vector2(-left[i].x, left[i].y));
  }

  const shape = new THREE.Shape(pts);
  const depth = o.thickness ?? 0.02;
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 2, steps: 1 });
  g.translate(0, 0, -depth / 2);
  // Subdivide-free bending: displace by position so even coarse leaves curve.
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const span = o.shape === 'palmate' ? 0.5 : Math.max(w, 0.05);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    z -= (o.bend ?? 0) * y * y;
    z += (o.fold ?? 0) * Math.abs(x);
    z += (o.cup ?? 0) * x * x * 4;
    if (o.ruffle) z += o.ruffle * Math.sin(y * (o.ruffleFreq ?? 40) + x * 9) * Math.min(1, Math.abs(x) / span);
    if (o.wave && o.shape === 'round') z += o.wave * 0.25 * Math.sin(Math.atan2(x, y - 0.5) * 9) * Math.hypot(x, y - 0.5);
    pos.setZ(i, z);
    uv.setXY(i, 0.5 + x / (2 * span), y);
  }
  g.computeVertexNormals();
  leafCache.set(key, g);
  return g;
}

/** Orient a leaf: length axis along `dir`, face toward `face`, then scale. */
export function leafMatrix(pos: THREE.Vector3, dir: THREE.Vector3, face: THREE.Vector3, sx: number, sy = sx, sz = sx): THREE.Matrix4 {
  const Y = dir.clone().normalize();
  const Z = face.clone().addScaledVector(Y, -face.dot(Y));
  if (Z.lengthSq() < 1e-6) Z.set(0, 0, 1).addScaledVector(Y, -Y.z);
  Z.normalize();
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
  const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(sx), Y.multiplyScalar(sy), Z.multiplyScalar(sz));
  m.setPosition(pos);
  return m;
}


interface Batch {
  parent: THREE.Object3D;
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  ink: InkWeight | null;
  wind: number;
  shadow: boolean;
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
}

/** Collect many copies of one geometry + material under a parent; `flush` turns each set into an InstancedMesh. */
export class Batches {
  private batches = new Map<string, Batch>();

  add(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, matrix: THREE.Matrix4, o: { color?: THREE.ColorRepresentation; ink?: InkWeight | null; wind?: number; shadow?: boolean } = {}): void {
    const ink = o.ink === undefined ? 'thin' : o.ink;
    const wind = o.wind ?? 0;
    const key = `${parent.uuid}|${geo.uuid}|${mat.uuid}|${ink}|${wind}`;
    let b = this.batches.get(key);
    if (!b) {
      b = { parent, geo, mat, ink, wind, shadow: o.shadow ?? true, matrices: [], colors: [] };
      this.batches.set(key, b);
    }
    b.matrices.push(matrix);
    b.colors.push(new THREE.Color(o.color ?? 0xffffff));
  }

  flush(): void {
    for (const b of this.batches.values()) {
      const inst = new THREE.InstancedMesh(b.geo, b.mat, b.matrices.length);
      b.matrices.forEach((m, i) => {
        inst.setMatrixAt(i, m);
        inst.setColorAt(i, b.colors[i]);
      });
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.castShadow = b.shadow;
      inst.receiveShadow = true;
      inst.computeBoundingSphere();
      inst.userData.shared = true; // geometry is cached and shared
      if (b.ink) outlineX(inst, b.ink, b.wind);
      b.parent.add(inst);
    }
    this.batches.clear();
  }
}


/** Adds a mesh with optional ink outline. Plant parts pass `wind` so the outline sways with them. */
export function add(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, p: V3 = [0, 0, 0], o: { ink?: InkWeight | null; wind?: number; rot?: V3; scale?: V3 | number; shadow?: boolean } = {}): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p);
  if (o.rot) m.rotation.set(...o.rot);
  if (o.scale !== undefined) typeof o.scale === 'number' ? m.scale.setScalar(o.scale) : m.scale.set(...o.scale);
  m.castShadow = o.shadow ?? true;
  m.receiveShadow = true;
  const ink = o.ink === undefined ? 'thin' : o.ink;
  if (ink) outlineX(m, ink, o.wind ?? 0);
  parent.add(m);
  return m;
}

export function box(w: number, h: number, d: number, mat: THREE.Material, parent: THREE.Object3D, p: V3 = [0, 0, 0], o: Parameters<typeof add>[4] & { r?: number } = {}): THREE.Mesh {
  const r = Math.max(0.002, Math.min(o.r ?? 0.01, Math.min(w, h, d) / 2 - 0.001));
  return add(new RoundedBoxGeometry(w, h, d, 2, r), mat, parent, p, o);
}

/** A tube along a curve, for stems, vines and hoops. */
export function tube(points: THREE.Vector3[], radius: number, mat: THREE.Material, parent: THREE.Object3D, o: { ink?: InkWeight | null; wind?: number; seg?: number; radial?: number; taper?: number } = {}): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const seg = o.seg ?? Math.max(6, points.length * 4);
  const g = new THREE.TubeGeometry(curve, seg, radius, o.radial ?? 6, false);
  if (o.taper) {
    // Narrow toward the end of the curve.
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const radial = (o.radial ?? 6) + 1;
    for (let i = 0; i <= seg; i++) {
      const k = 1 - (i / seg) * o.taper;
      const c = curve.getPointAt(i / seg);
      for (let j = 0; j < radial; j++) {
        const idx = i * radial + j;
        const v = new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)).sub(c).multiplyScalar(k).add(c);
        pos.setXYZ(idx, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals();
  }
  return add(g, mat, parent, [0, 0, 0], { ink: o.ink === undefined ? 'thin' : o.ink, wind: o.wind });
}

/** Plant-part material: toon that sways with the wind. */
export const plantMat = (color: THREE.ColorRepresentation, o: ToonOpts = {}) => toon(color, { wind: WIND, ...o });
