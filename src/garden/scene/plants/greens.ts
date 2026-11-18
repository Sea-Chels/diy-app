import * as THREE from 'three';
import { leafMatrix, range, jitter } from '../../../shared/scene/kit';
import { V, UP, CYL, SPHERE, ROOT, flowerGeo, BERRY, type PlantKit, plantGroup, put, faceM, ballM, stalkM, mix, vary, outUp, G } from './kit';

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
