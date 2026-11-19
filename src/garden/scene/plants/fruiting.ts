import * as THREE from 'three';
import { leafMatrix, range, jitter, tube, add } from '../../../shared/scene/kit';
import { V, UP, CYL, SPHERE, CAPSULE, DISC, flowerGeo, POM, PUMPKIN, CORN_LEAF, type PlantKit, plantGroup, put, faceM, ballM, stalkM, vary, outUp, G, WIND } from './kit';

export function tomato(k: PlantKit, parent: THREE.Object3D, p: THREE.Vector3, o: { cage?: boolean; cageMat?: THREE.Material } = {}): THREE.Group {
  const g = plantGroup(parent, p, k.r() * 6.28);
  const H = k.season === 'spring' ? 0.32 : k.season === 'summer' ? 0.95 : 0.9;
  const stemMat = k.stem(0x5d8f3a);
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
      const ring = add(new THREE.TorusGeometry(r, 0.004, 5, 28), o.cageMat, g, { at: [0, y, 0], rot: [Math.PI / 2, 0, 0], ink: null });
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
    for (let i = 0; i < 10; i++) {
      put(k, g, CYL, k.plain, stalkM(V(0, H - (i ? 0.03 : 0), 0), outUp(i * 0.7, i === 0 ? 1.57 : range(k.r, 1.0, 1.3)), i === 0 ? 0.24 : 0.17, 0.004), fall ? 0xa98a4a : 0xe2d48a, null);
    }
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
    // In fall the lowest leaves brown and hang; the rest stay green.
    const old = k.season === 'fall' && i < 4;
    const droop = old ? -0.9 : k.season === 'fall' ? -0.4 : -0.25;
    put(k, g, G.heartTooth, k.leaf, leafMatrix(V(0, h, 0).addScaledVector(d, sl), outUp(a, droop), UP, size), old ? 0xa59a46 : vary(k, 0x55993a, 0.05));
  }
  if (k.season === 'spring') return g;
  // Head: textured seed disc, petals in two rows, green back.
  // Fall heads nod a little but still face forward.
  const droop = k.season === 'fall' ? 0.45 : 0.25;
  const face = V(Math.cos(facing) * Math.cos(droop), Math.sin(-droop) * 0.6 + 0.25, Math.sin(facing) * Math.cos(droop)).normalize();
  const center = top.clone().addScaledVector(face, 0.03);
  const head = add(DISC, k.seedHead, g, { at: [center.x, center.y, center.z], wind: WIND });
  head.quaternion.setFromUnitVectors(UP, face);
  head.scale.set(0.11, 0.5, 0.11);
  const petals = k.season === 'fall' ? 16 : 22;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const X = new THREE.Vector3().crossVectors(UP, face).normalize();
    const Y = new THREE.Vector3().crossVectors(face, X);
    const d = X.clone().multiplyScalar(Math.cos(a)).addScaledVector(Y, Math.sin(a));
    const base = center.clone().addScaledVector(d, 0.1).addScaledVector(face, -0.004 - (i % 2) * 0.004);
    put(k, g, G.petal, k.plain, leafMatrix(base, d.clone().addScaledVector(face, -0.15), face, 0.085), k.season === 'fall' ? (i % 2 ? 0xe0a020 : 0xc8862a) : i % 2 ? 0xffc21a : 0xffd84a);
  }
  return g;
}
