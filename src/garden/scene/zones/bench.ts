import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { WIND, add, box, jitter, leafMatrix } from '../../../shared/scene/kit';
import { basil, tomato } from '../plants/fruiting';
import { strawberry } from '../plants/greens';
import { CYL, G as LEAVES } from '../plants/kit';
import { V, UP, UNIT_BOX } from '../geometry';
import type { GardenCtx } from '../ctx';

export function buildPottingBench(c: GardenCtx) {
  const { season, r, b, k, M, area, pick, inst } = c;
  const seedlings = area('seedlings', -4.9, -0.75, Math.PI / 2);
  {
    const W = 1.5;
    const D = 0.6;
    const H = 0.85;
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.06, H, 0.06, M.weathered, seedlings, [(x * (W - 0.1)) / 2, H / 2, (z * (D - 0.1)) / 2]);
    for (let i = 0; i < 6; i++) inst(seedlings, UNIT_BOX, M.weathered, [0, H, -D / 2 + 0.05 + i * 0.1], [W, 0.03, 0.09], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.05)));
    box(W, 0.03, D - 0.1, M.weathered, seedlings, [0, 0.25, 0]);
    box(W, 0.5, 0.03, M.weathered, seedlings, [0, H + 0.25, -D / 2]);
    box(W, 0.03, 0.2, M.weathered, seedlings, [0, H + 0.45, -D / 2 + 0.1]);
    const tray = toon(0x23252b);
    const cotyledon = LEAVES.ovateCup;
    for (const tx of [-0.42, 0.12]) {
      box(0.5, 0.06, 0.28, tray, seedlings, [tx, H + 0.045, 0.05], { r: 0.008 });
      for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
        const p = V(tx - 0.21 + i * 0.06, H + 0.075, 0.05 - 0.09 + j * 0.06);
        inst(seedlings, UNIT_BOX, M.soil, [p.x, p.y, p.z], [0.05, 0.005, 0.05], 0xffffff, [0, 0, 0], null);
        const base = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(UP, r() * 6), V(1, 1, 1));
        const sz = season === 'spring' ? 0.03 : 0.022;
        for (const sd of [-1, 1]) b.add(seedlings, cotyledon, k.leaf, base.clone().multiply(leafMatrix(V(0, 0.02, 0), V(sd, 0.6, 0), UP, sz)), { color: 0x7cc957, ink: 'thin', wind: WIND });
        b.add(seedlings, CYL, k.plain, base.clone().multiply(new THREE.Matrix4().makeScale(0.002, 0.022, 0.002)), { color: 0x9ad06a, ink: null, wind: WIND });
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = -0.6 + i * 0.3;
      add(new THREE.CylinderGeometry(0.07, 0.05, 0.11, 14), M.terracotta, seedlings, [x, H + 0.52, -D / 2 + 0.1]);
      if (i % 2 === 0) basil(k, seedlings, V(x, H + 0.57, -D / 2 + 0.1));
      else strawberry(k, seedlings, V(x, H + 0.57, -D / 2 + 0.1));
    }
    add(new THREE.CylinderGeometry(0.1, 0.075, 0.15, 14), M.terracotta, seedlings, [0.6, H + 0.09, 0.05]);
    tomato(k, seedlings, V(0.6, H + 0.16, 0.05));
    box(0.45, 0.32, 0.22, toon(0x3f8a5a), seedlings, [-0.4, 0.43, 0], { r: 0.06 });
    pick(seedlings, W + 0.1, 1.5, D + 0.2, [0, 0.75, 0]);
  }
}
