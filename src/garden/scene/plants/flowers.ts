import * as THREE from 'three';
import { leafMatrix, range, jitter, tube } from '../../../shared/scene/kit';
import { V, UP, CYL, SPHERE, flowerGeo, POM, type PlantKit, plantGroup, put, faceM, ballM, stalkM, mix, vary, outUp, G, WIND } from './kit';

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
