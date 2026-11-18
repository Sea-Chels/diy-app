import * as THREE from 'three';
import { WIND, add, box, jitter, mapped, speckle } from '../../../shared/scene/kit';
import { climber } from '../plants/flowers';
import { lavender } from '../plants/herbs';
import { G as LEAVES } from '../plants/kit';
import { blueberry, goji, pawpaw } from '../plants/shrubs';
import { V, UNIT_BOX } from '../geometry';
import type { GardenCtx } from '../ctx';

export function buildFruit(c: GardenCtx) {
  const { season, r, b, k, M, area, pick, tag } = c;
  const fruit = area('fruit', 4.85, -1.25);
  {
    add(new THREE.CircleGeometry(0.9, 28), mapped(0xffffff, speckle('#6a4a2a', ['#8a5a32', '#4a3020', '#a0703a'], 800, [3, 8], [2, 2], 41)), fruit, [0, 0.01, -1.0], { rot: [-Math.PI / 2, 0, 0], ink: null }).castShadow = false;
    pawpaw(k, fruit, V(0, 0, -1.0));
    goji(k, fruit, V(0.1, 0, 0.55));
    // Blueberry in a half barrel of acidic mix.
    const bx = -0.8;
    const bz = 1.35;
    add(new THREE.CylinderGeometry(0.4, 0.34, 0.42, 20), M.cedar, fruit, [bx, 0.21, bz], { ink: 'body' });
    for (const y of [0.08, 0.34]) add(new THREE.TorusGeometry(0.39, 0.012, 6, 28), M.galvDark, fruit, [bx, y, bz], { rot: [Math.PI / 2, 0, 0], ink: null });
    add(new THREE.CircleGeometry(0.37, 20), mapped(0xffffff, speckle('#7a4a2a', ['#9a5a32', '#5a3020'], 400, [3, 7], [1, 1], 42)), fruit, [bx, 0.41, bz], { rot: [-Math.PI / 2, 0, 0], ink: null });
    blueberry(k, fruit, V(bx, 0.4, bz));
    tag(fruit, 'PAWPAW', [-0.45, 0, -0.55]);
    tag(fruit, 'GOJI', [-0.35, 0, 0.6]);
    if (season === 'fall') {
      for (let i = 0; i < 40; i++) {
        const a = r() * 6.28;
        const rr = Math.sqrt(r()) * 1.3;
        const m = new THREE.Matrix4().compose(V(Math.cos(a) * rr, 0.012, -1.0 + Math.sin(a) * rr), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + jitter(r, 0.2), 0, r() * 6.28)), V(0.2, 0.2, 0.2));
        b.add(fruit, LEAVES.obovate, k.leaf, m, { color: new THREE.Color(0xe8b030).offsetHSL(jitter(r, 0.03), 0, jitter(r, 0.1)), ink: 'thin', wind: WIND });
      }
    }
    pick(fruit, 1.6, 3.2, 3.6, [0, 1.6, -0.2]);
  }
}

export function buildArbor(c: GardenCtx) {
  const { k, M, area, pick, inst } = c;
  const arbor = area('arbor', 0, 4.25);
  {
    const H = 2.2;
    for (const x of [-0.7, 0.7]) for (const z of [-0.32, 0.32]) box(0.1, H, 0.1, M.cedar, arbor, [x, H / 2, z], { r: 0.01 });
    for (const z of [-0.32, 0.32]) box(2.1, 0.16, 0.06, M.cedar, arbor, [0, H - 0.05, z], { r: 0.01 });
    for (let i = 0; i < 6; i++) box(0.05, 0.08, 0.95, M.cedar, arbor, [-0.85 + i * 0.34, H + 0.07, 0], { r: 0.008 });
    for (const x of [-0.7, 0.7]) {
      for (let y = 0.55; y < 1.9; y += 0.3) for (const z of [-0.13, 0.13]) for (const sd of [-1, 1]) inst(arbor, UNIT_BOX, M.cedar, [x, y, z], [0.02, 0.36, 0.025], 0xffffff, [sd * 0.72, 0, 0]);
    }
    for (const x of [-0.7, 0.7]) for (let i = 0; i < 4; i++) inst(arbor, UNIT_BOX, M.cedar, [x, 0.4 + i * 0.4, 0], [0.025, 0.025, 0.62]);
    // Roses up both sides and over the top.
    for (const sd of [-1, 1]) {
      climber(k, arbor, [V(sd * 0.75, 0, 0.36), V(sd * 0.72, 0.8, 0.3), V(sd * 0.7, 1.6, 0.32), V(sd * 0.55, 2.25, 0.2), V(sd * 0.1, 2.32, 0.0)], { leaf: 0x3b6b35, flowers: sd < 0 ? [0xff6f91, 0xff3d6a] : [0xffffff, 0xffd0dc], petals: 5, flowerSize: 0.05, density: 46 });
    }
    for (const sd of [-1, 1]) lavender(k, arbor, V(sd * 1.15, 0, 0.1));
    pick(arbor, 2.2, 2.5, 0.9, [0, 1.25, 0]);
  }
}
