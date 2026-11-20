import * as THREE from 'three';
import { leafMatrix, range, jitter, tube } from '../../../shared/scene/kit';
import { V, UP, CYL, SPHERE, CAPSULE, flowerGeo, POM, type PlantKit, plantGroup, put, faceM, ballM, stalkM, vary, outUp, G, WIND } from './kit';
import { C } from '../palette';
import { TONE } from '../../../shared/theme';

export function lavender(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let i = 0; i < 40; i++) {
    const a = i * 2.39996;
    const at = V(Math.cos(a) * 0.05 * k.r(), 0.01, Math.sin(a) * 0.05 * k.r());
    put(k, g, G.needle, k.leaf, leafMatrix(at, outUp(a, range(k.r, 0.9, 1.4)), UP, range(k.r, 0.08, 0.13)), vary(k, C.sage.leaf, 0.05));
  }
  if (k.season !== 'spring') {
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996;
      const d = outUp(a, range(k.r, 1.15, 1.45));
      const len = range(k.r, 0.22, 0.3);
      put(k, g, CYL, k.plain, stalkM(V(), d, len, 0.0018), C.sage.lavender, null);
      put(k, g, CAPSULE, k.plain, leafMatrix(d.clone().multiplyScalar(len), d, UP, 0.008, 0.016, 0.008), k.season === 'fall' ? C.purple.lavenderFall : C.purple.lavender);
    }
  }
  return g;
}

export function rosemary(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let s = 0; s < 11; s++) {
    const a = s * 2.39996 + jitter(k.r, 0.3);
    const top = outUp(a, range(k.r, 1.05, 1.4)).multiplyScalar(range(k.r, 0.35, 0.52));
    put(k, g, CYL, k.plain, stalkM(V(), top, top.length(), 0.005), C.wood.rosemary);
    for (let i = 0; i < 26; i++) {
      const at = top.clone().multiplyScalar(0.15 + 0.85 * (i / 26));
      put(k, g, G.needle, k.leaf, leafMatrix(at, outUp(i * 2.4, range(k.r, 0.3, 0.9)), UP, 0.065), vary(k, C.green.pine, 0.05));
    }
    if (k.season === 'spring') put(k, g, flowerGeo(5, 0.3, 0.2), k.plain, faceM(top, UP, 0.01), C.blue.rosemary);
  }
  return g;
}

export function sage(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996;
    const sl = range(k.r, 0.04, 0.1);
    const d = outUp(a, range(k.r, 0.7, 1.2));
    put(k, g, CYL, k.plain, stalkM(V(), d, sl, 0.003), C.sage.stem);
    put(k, g, G.ovate, k.leaf, leafMatrix(d.clone().multiplyScalar(sl), outUp(a, 0.4), UP, range(k.r, 0.065, 0.085)), vary(k, C.sage.leaf, 0.04));
  }
  if (k.season === 'summer') {
    for (let i = 0; i < 4; i++) {
      const d = outUp(i * 1.6, 1.35);
      put(k, g, CYL, k.plain, stalkM(V(), d, 0.22, 0.002), C.sage.stem, null);
      put(k, g, CAPSULE, k.plain, leafMatrix(d.clone().multiplyScalar(0.22), d, UP, 0.008, 0.02, 0.008), C.purple.sage);
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
    put(k, g, SPHERE, k.leaf, ballM(at, 0.014, 0.008, 0.01), vary(k, C.green.olive, 0.06), i % 4 ? null : 'thin');
    if (k.season === 'summer' && i % 5 === 0) put(k, g, SPHERE, k.plain, ballM(at.clone().add(V(0, 0.012, 0)), 0.008), C.pink.thyme, null);
  }
  return g;
}

export function chamomile(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28, k.growth * 0.6 + 0.4);
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996;
    put(k, g, G.pinnate, k.leaf, leafMatrix(V(0, 0.01, 0), outUp(a, range(k.r, 0.9, 1.3)), UP, range(k.r, 0.08, 0.12)), vary(k, C.green.herb, 0.05));
  }
  const n = k.season === 'spring' ? 3 : 12;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const fp = V(Math.cos(a) * 0.07 * k.r(), range(k.r, 0.2, 0.3), Math.sin(a) * 0.07 * k.r());
    put(k, g, CYL, k.plain, stalkM(V(), fp, fp.length(), 0.0015), C.green.herb, null);
    put(k, g, flowerGeo(13, 0.15, 0.05, 0.5), k.plain, faceM(fp, V(jitter(k.r, 0.4), 1, jitter(k.r, 0.4)), 0.018), TONE.white, null);
    put(k, g, SPHERE, k.plain, ballM(fp.clone().add(V(0, 0.004, 0)), 0.006, 0.005, 0.006), C.yellow.bloom, null);
  }
  return g;
}

/** Marshmallow (Althaea officinalis): tall velvety gray-green stems, pale pink flowers up top. */
export function marshmallow(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const H = k.season === 'spring' ? 0.55 : range(k.r, 1.15, 1.35);
  for (let s = 0; s < 4; s++) {
    const a = s * 1.6 + jitter(k.r, 0.4);
    const reach = range(k.r, 0.14, 0.24);
    const pts = [V(0, 0, 0), V(Math.cos(a) * reach * 0.5, H * 0.5, Math.sin(a) * reach * 0.5), V(Math.cos(a) * reach, H * range(k.r, 0.85, 1), Math.sin(a) * reach)];
    tube(pts, 0.005, k.stem(C.sage.stem), g, { wind: WIND, taper: 0.5, radial: 5 });
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let i = 0; i < 15; i++) {
      const t = 0.05 + 0.9 * (i / 15);
      const at = curve.getPointAt(t);
      const la = i * 2.39996 + s;
      const size = 0.15 * (1 - 0.5 * t);
      put(k, g, G.heartTooth, k.leaf, leafMatrix(at, outUp(la, -0.2), UP, size), vary(k, C.sage.balm, 0.04));
      if (k.season !== 'spring' && t > 0.55) {
        for (let f = 0; f < 2; f++) {
          const fp = at.clone().add(outUp(la + f * 2, 0.3).multiplyScalar(0.025));
          if (k.season === 'summer') {
            put(k, g, flowerGeo(5, 0.25, 0.25, 0.5), k.plain, faceM(fp, outUp(la + f * 2, 0.5), 0.028), C.pink.bloom);
            put(k, g, SPHERE, k.plain, ballM(fp.clone().add(outUp(la + f * 2, 0.5).multiplyScalar(0.003)), 0.004), C.pink.bloomEye, null);
          } else {
            put(k, g, POM, k.plain, ballM(fp, 0.008), C.straw.seed, null);
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
    put(k, g, CYL, k.plain, stalkM(V(Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02), d, len, 0.0025), vary(k, C.green.bean, 0.05), null);
    if (k.season !== 'fall' && i % 4 === 0) put(k, g, POM, k.plain, ballM(d.clone().multiplyScalar(len), 0.016), C.purple.chive);
  }
  return g;
}
