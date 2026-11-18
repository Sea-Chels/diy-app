import * as THREE from 'three';
import { add, box, jitter, mapped, speckle, UNIT_BOX } from '../../../shared/scene/kit';
import { UNIT_CYL, LOW_SPHERE } from '../geometry';
import type { GardenCtx } from '../ctx';

export function buildCompost(c: GardenCtx) {
  const { r, lidHooks, steam, steamBase, white, M, area, pick, inst } = c;
  const compost = area('compost', 3.55, -3.55);
  {
    const W = 2.7;
    const D = 0.95;
    const H = 0.92;
    const bayW = W / 3;
    const fronts: THREE.Group[] = [];
    for (let i = 0; i <= 3; i++) {
      const x = -W / 2 + i * bayW;
      for (const z of [-D / 2, D / 2]) box(0.08, H + 0.06, 0.08, M.weathered, compost, { at: [x, (H + 0.06) / 2, z], r: 0.01 });
      for (let j = 0; j < 6; j++) inst(compost, UNIT_BOX, M.weathered, [x, 0.09 + j * 0.15, 0], [0.025, 0.12, D - 0.06], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.06)));
    }
    for (let j = 0; j < 6; j++) inst(compost, UNIT_BOX, M.weathered, [0, 0.09 + j * 0.15, -D / 2 - 0.02], [W, 0.12, 0.025], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.06)));
    for (let i = 0; i < 3; i++) {
      const cx = -W / 2 + bayW * (i + 0.5);
      const f = new THREE.Group();
      f.position.set(cx, 0, D / 2 + 0.03);
      compost.add(f);
      fronts.push(f);
      for (let j = 0; j < (i === 2 ? 2 : 4); j++) box(bayW - 0.1, 0.12, 0.025, M.weathered, f, { at: [0, 0.09 + j * 0.15, 0], r: 0.004 });
      // Piles: fresh scraps, a hot pile, finished compost.
      const pile = [
        mapped(0xffffff, speckle('#5a4a2a', ['#7aa83a', '#e0b040', '#c0602a', '#f0f0e0', '#3a6a2a', '#a07a3a'], 1300, [3, 8], [2, 2], 31)),
        mapped(0xffffff, speckle('#3a2818', ['#5a4028', '#6a5a30', '#2a1a10'], 1000, [2, 6], [2, 2], 32)),
        mapped(0xffffff, speckle('#24170f', ['#1a100a', '#3a2818', '#30200f'], 1000, [1, 4], [2, 2], 33)),
      ][i];
      add(LOW_SPHERE, pile, compost, { at: [cx, 0.05, -0.02], scale: [bayW * 0.46, [0.62, 0.55, 0.35][i], D * 0.44] });
    }
    const bits: [number, number][] = [[0xf2d24a, 0.03], [0xd8432f, 0.025], [0xf4efe0, 0.02], [0x7aa83a, 0.03], [0xe08a2a, 0.025]];
    for (let i = 0; i < 26; i++) {
      const [col, sz] = bits[i % bits.length];
      const a = r() * 6.28;
      const rr = Math.sqrt(r()) * 0.3;
      const x = -W / 2 + bayW * 0.5 + Math.cos(a) * rr;
      const z = -0.02 + Math.sin(a) * rr * 0.9;
      const y = 0.05 + 0.6 * Math.sqrt(Math.max(0, 1 - (rr / 0.39) ** 2));
      inst(compost, LOW_SPHERE, white, [x, y, z], [sz * 1.6, sz * 0.7, sz], col, [r(), r(), r()]);
    }
    {
      const fork = new THREE.Group();
      fork.position.set(W / 2 + 0.12, 0, 0.25);
      fork.rotation.z = 0.22;
      compost.add(fork);
      add(UNIT_CYL, M.handle, fork, { at: [0, 0.75, 0], scale: [0.016, 1.1, 0.016] });
      box(0.2, 0.03, 0.03, M.steel, fork, { at: [0, 0.2, 0], r: 0.008 });
      for (let t = 0; t < 4; t++) add(UNIT_CYL, M.steel, fork, { at: [-0.075 + t * 0.05, 0.08, 0], scale: [0.006, 0.24, 0.006] });
    }
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(LOW_SPHERE, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      puff.position.set(jitter(r, 0.2), 0.6, -0.02);
      puff.userData.phase = i / 5;
      compost.add(puff);
      steam.push(puff);
    }
    steamBase.set(-W / 2 + bayW * 1.5, 0, 0);
    lidHooks.compostSlats = (t) => fronts.forEach((f, i) => (f.rotation.x = (1.35 - i * 0.05) * t));
    pick(compost, [W + 0.3, H + 0.2, D + 0.2], [0, H / 2, 0]);
  }
}
