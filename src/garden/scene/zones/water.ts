import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, box, jitter, tube, UNIT_BOX, V } from '../../../shared/scene/kit';
import { basil } from '../plants/fruiting';
import { lettuce, strawberry } from '../plants/greens';
import { UP, UNIT_CYL, BH } from '../geometry';
import type { GardenCtx } from '../ctx';
import { C } from '../palette';
import { TONE } from '../../../shared/theme';

export function buildRainBarrel(c: GardenCtx) {
  const { spigot, root, M, area, pick, inst } = c;
  // Under the shed's front-east downspout, in view from the main path.
  const WX = -3.05, WZ = -1.99;
  const water = area('water', WX, WZ);
  {
    for (const x of [-0.13, 0.13]) box(0.2, 0.2, 0.4, M.stone, water, { at: [x, 0.1, 0], r: 0.01 });
    const barrel = new THREE.LatheGeometry([0, 0.3, 0.32, 0.33, 0.32, 0.3, 0].map((rr, i) => new THREE.Vector2(rr, [0, 0, 0.15, 0.45, 0.75, 0.9, 0.9][i])), 24);
    add(barrel, M.barrel, water, { at: [0, 0.2, 0], ink: 'body' });
    for (const y of [0.35, 0.6, 0.85]) add(new THREE.TorusGeometry(0.325, 0.012, 6, 32), M.barrel, water, { at: [0, y, 0], rot: [Math.PI / 2, 0, 0], ink: null });
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 18), M.galvDark, water, { at: [0, 1.11, 0] });
    add(UNIT_CYL, M.brass, water, { at: [0.18, 0.32, 0.27], rot: [Math.PI / 2, 0, 0], scale: [0.018, 0.1, 0.018] });
    add(UNIT_CYL, M.brass, water, { at: [0.18, 0.3, 0.33], scale: [0.014, 0.05, 0.014] });
    spigot.set(WX + 0.18, 0.27, WZ + 0.33);
    // Hose runs to the drip header behind the raised bed.
    const hose: THREE.Vector3[] = [V(0.18, 0.27, 0.34), V(0.26, 0.03, 0.55), V(0.22, 0.02, 0.95), V(0.25, 0.02, 1.22)];
    tube(hose, 0.016, M.hose, water, { seg: 80 });
    pick(water, [0.9, 1.3, 0.9], [0, 0.65, 0]);
  }
  // Drip line: header along the cross path, emitters in each bed.
  {
    const beds = new THREE.Group();
    beds.userData.batchRoot = true;
    root.add(beds);
    tube([V(-2.7, 0.02, -0.77), V(-0.25, 0.02, -0.85), V(-0.3, 0.02, 0.9), V(-0.9, 0.02, 1.0)], 0.01, M.drip, beds, { seg: 60, ink: null });
    for (const [x0, top] of [[-1.75, BH - 0.02], [1.75, BH - 0.02]] as const) {
      for (const z of [-0.15, 0.25]) {
        const pts = [V(x0 - 1.1, top, z), V(x0 + 1.1, top, z)];
        tube(pts, 0.007, M.drip, beds, { seg: 4, ink: null });
        for (let i = 0; i < 8; i++) inst(beds, UNIT_CYL, M.drip, [x0 - 1.0 + i * 0.28, top + 0.005, z], [0.012, 0.012, 0.012], TONE.white, [0, 0, 0], null);
      }
    }
  }
}

export function buildHydro(c: GardenCtx) {
  const { r, k, M, area, pick, inst, s } = c;
  const hydro = area('hydro', 2.0, 2.65);
  {
    // Brick base, as in the photo, holds the reservoir or the frame.
    // The NFT rack stands on the ground, so its reservoir gets a smaller base beside it.
    const nftMode = s.hydro === 'nft';
    const baseX = nftMode ? -0.82 : 0;
    for (let row = 0; row < 3; row++) inst(hydro, UNIT_BOX, M.brick, [baseX, 0.06 + row * 0.12, 0], nftMode ? [0.78, 0.12, 0.62] : [1.3, 0.12, 0.7], new THREE.Color(TONE.white).offsetHSL(0, 0, jitter(r, 0.04)));
    const baseTop = 0.36;
    const net = toon(C.rubber);
    const cup = (g: THREE.Object3D, p: THREE.Vector3, dir: THREE.Vector3, plant: number) => {
      add(UNIT_CYL, M.pvc, g, { at: [p.x, p.y, p.z], scale: [0.04, 0.07, 0.04], rot: [Math.atan2(dir.z, dir.y), 0, -Math.atan2(dir.x, dir.y)] });
      inst(g, UNIT_CYL, net, [p.x, p.y + 0.03, p.z], [0.032, 0.02, 0.032], TONE.white, [0, 0, 0], null);
      const at = V(p.x, p.y + 0.04, p.z);
      if (plant === 0) lettuce(k, hydro, at, { s: 0.6, red: r() > 0.6 });
      else if (plant === 1) strawberry(k, hydro, at);
      else basil(k, hydro, at);
    };
    if (s.hydro === 'tower') {
      // Reservoir tote at the bottom with the pump, three vertical towers.
      box(1.1, 0.34, 0.5, M.tote, hydro, { at: [0, baseTop + 0.17, 0], r: 0.03 });
      add(UNIT_CYL, M.pvc, hydro, { at: [0, baseTop + 0.4, 0], rot: [0, 0, Math.PI / 2], scale: [0.05, 1.05, 0.05] });
      for (let t = 0; t < 3; t++) {
        const x = -0.38 + t * 0.38;
        const H = 1.55;
        add(UNIT_CYL, M.pvc, hydro, { at: [x, baseTop + 0.4 + H / 2, 0], scale: [0.06, H, 0.06] });
        add(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 14), M.pvc, hydro, { at: [x, baseTop + 0.4 + H + 0.02, 0] });
        for (let i = 0; i < 7; i++) {
          const a = i * 2.1 + t;
          const d = V(Math.cos(a), 0.9, Math.sin(a)).normalize();
          const p = V(x + Math.cos(a) * 0.075, baseTop + 0.55 + i * 0.2, Math.sin(a) * 0.075);
          cup(hydro, p, d, (i + t) % 3);
        }
        tube([V(x, baseTop + 0.4 + H + 0.05, 0), V(x + 0.05, baseTop + H + 0.6, 0.08), V(0.45, baseTop + H + 0.5, 0.2)], 0.012, M.hose, hydro, { seg: 20 });
      }
      tube([V(0.45, baseTop + 0.3, 0.25), V(0.48, baseTop + 1.2, 0.25), V(0.45, baseTop + 1.9, 0.2)], 0.012, M.hose, hydro, { seg: 20 });
    } else if (s.hydro === 'nft') {
      // A-frame of sloped channels on the ground; water trickles down and drains into the tote.
      box(0.66, 0.3, 0.5, M.tote, hydro, { at: [baseX, baseTop + 0.15, 0], r: 0.03 });
      const RX = 0.42;
      for (const sd of [-1, 1]) {
        add(UNIT_BOX, M.weathered, hydro, { at: [RX + sd * 0.6, 0.72, -0.05], scale: [0.05, 1.45, 0.05], rot: [0.32, 0, 0] });
        add(UNIT_BOX, M.weathered, hydro, { at: [RX + sd * 0.6, 0.72, 0.4], scale: [0.05, 1.45, 0.05], rot: [-0.32, 0, 0] });
        add(UNIT_BOX, M.weathered, hydro, { at: [RX + sd * 0.6, 0.3, 0.175], scale: [0.04, 0.04, 0.62] });
      }
      for (let lvl = 0; lvl < 3; lvl++) {
        for (const sd of [-1, 1]) {
          const y = 0.42 + lvl * 0.38;
          const z = 0.18 + sd * (0.34 - lvl * 0.12);
          box(1.3, 0.08, 0.1, M.pvc, hydro, { at: [RX, y, z], rot: [0, 0, 0.03], r: 0.025 });
          for (let i = 0; i < 5; i++) cup(hydro, V(RX - 0.44 + i * 0.22, y + 0.04 + i * 0.0066, z), UP, (i + lvl) % 3 === 1 ? 2 : 0);
        }
      }
      // Drain from the low ends into the tote, feed hose from the pump up to the high ends.
      tube([V(RX - 0.66, 1.1, 0.18), V(RX - 0.7, 0.75, 0.18), V(baseX + 0.2, baseTop + 0.4, 0.1), V(baseX + 0.15, baseTop + 0.28, 0.05)], 0.02, M.pvc, hydro, { seg: 24 });
      tube([V(baseX - 0.1, baseTop + 0.3, -0.05), V(baseX - 0.05, baseTop + 0.55, -0.2), V(RX, 1.45, -0.25), V(RX + 0.68, 1.3, 0.18)], 0.012, M.hose, hydro, { seg: 30 });
    } else {
      // Deep water culture: a tote with a floating raft and an air pump.
      box(1.2, 0.36, 0.6, M.tote, hydro, { at: [0, baseTop + 0.18, 0], r: 0.03 });
      box(1.1, 0.04, 0.52, toon(TONE.porcelain), hydro, { at: [0, baseTop + 0.37, 0], r: 0.01 });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cup(hydro, V(-0.42 + i * 0.28, baseTop + 0.38, -0.12 + j * 0.24), UP, i === 3 ? 2 : 0);
      box(0.18, 0.1, 0.12, toon(C.rubber), hydro, { at: [0.75, 0.05, 0.3], r: 0.02 });
      tube([V(0.75, 0.1, 0.3), V(0.7, 0.4, 0.3), V(0.55, 0.6, 0.25), V(0.4, 0.58, 0.2)], 0.006, toon(C.cream.airline), hydro, { seg: 20, ink: null });
    }
    pick(hydro, [nftMode ? 2.3 : 1.4, 2.4, 0.9], [nftMode ? -0.1 : 0, 1.2, 0]);
  }
}
