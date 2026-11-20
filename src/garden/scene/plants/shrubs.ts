import * as THREE from 'three';
import { leafMatrix, range, jitter, tube } from '../../../shared/scene/kit';
import { V, UP, SPHERE, CAPSULE, flowerGeo, type PlantKit, plantGroup, put, faceM, ballM, vary, outUp, G, WIND } from './kit';
import { C } from '../palette';

export function pawpaw(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const s = k.season;
  const H = 3.1;
  const bark = k.stem(C.wood.bark);
  tube([V(0, 0, 0), V(0.03, H * 0.4, 0), V(-0.02, H * 0.75, 0.02), V(0, H, 0)], 0.075, bark, g, { wind: WIND, taper: 0.75, radial: 8 });
  const leafCol = s === 'fall' ? C.yellow.fall : s === 'spring' ? C.green.springLeaf : C.green.shrubLeaf;
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
          put(k, g, flowerGeo(6, 0.35, -0.5, 0.9), k.plain, faceM(at, V(0, -1, 0.2), 0.035, k.r() * 6), C.red.currant, 'body');
        }
      } else if (i % 2 === 0 && h < 2.6) {
        const at = curve.getPointAt(0.55);
        const n2 = 2 + Math.floor(k.r() * 3);
        for (let f = 0; f < n2; f++) {
          const fa = (f / n2) * 6.28;
          const fp = at.clone().add(V(Math.cos(fa) * 0.06, -0.2, Math.sin(fa) * 0.06));
          put(k, g, CAPSULE, k.shiny, leafMatrix(fp, V(Math.cos(fa) * 0.4, 1, Math.sin(fa) * 0.4), V(1, 0, 0), 0.05, 0.045, 0.045), s === 'fall' ? C.yellow.gooseberry : C.green.gooseberry, 'body');
        }
      }
    }
  }
  return g;
}

export function goji(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const cane = k.stem(C.wood.cane);
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
        put(k, g, G.lance, k.leaf, leafMatrix(at, outUp(k.r() * 6.28, range(k.r, -0.4, 0.5)), UP, range(k.r, 0.07, 0.095)), vary(k, C.green.cane, 0.06));
      }
      if (t > 0.5 && k.season !== 'spring' && i % (k.season === 'fall' ? 1 : 3) === 0) {
        put(k, g, CAPSULE, k.shiny, leafMatrix(at.clone().add(V(jitter(k.r, 0.03), -0.03, jitter(k.r, 0.03))), V(jitter(k.r, 0.3), 1, jitter(k.r, 0.3)), V(1, 0, 0), 0.011, 0.01, 0.011), C.red.raspberry);
      }
      if (k.season === 'summer' && i % 4 === 1) put(k, g, flowerGeo(5, 0.25, 0.2), k.plain, faceM(at, outUp(k.r() * 6.28, 0.4), 0.012), C.purple.raspberry);
    }
  }
  return g;
}

export function blueberry(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const wood = k.stem(C.wood.blueberry);
  const leafCol = k.season === 'fall' ? C.red.blueberryFall : C.green.blueberry;
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
          if (k.season === 'spring') put(k, g, CAPSULE, k.plain, ballM(bp, 0.008, 0.008, 0.008), C.cream.blossom);
          else put(k, g, SPHERE, k.shiny, ballM(bp, 0.013), k.season === 'summer' && b === 5 ? C.green.berryUnripe : C.blue.blueberry);
        }
      }
    }
  }
  return g;
}
