import * as THREE from 'three';
import { add, box, canvasTex, jitter, mapped, speckle, UNIT_BOX, V } from '../../../shared/scene/kit';
import { alyssum, beeBalm, cosmos, echinacea, zinnia } from '../plants/flowers';
import { basil, sunflower } from '../plants/fruiting';
import { chamomile, chives, lavender, marshmallow, rosemary, sage, thyme } from '../plants/herbs';
import type { GardenCtx } from '../ctx';

export function buildHerbSpiral(c: GardenCtx) {
  const { r, k, M, area, pick, inst, tag } = c;
  const herbs = area('herbs', -4.3, 1.35);
  {
    const turns = 1.3;
    const R0 = 1.0;
    const rad = (t: number) => R0 - 0.7 * t;
    const wall = (t: number) => 0.12 + 0.46 * t;
    // Terraced soil: each point sits just under the wall that encloses it from outside.
    const soilY = (th: number, rr: number) => {
      const t0 = th / (Math.PI * 2 * turns);
      let tk = t0;
      for (let kk = 1; kk < 4; kk++) {
        const t2 = t0 + kk / turns;
        if (t2 > 1 || rad(t2) + 0.06 < rr) break;
        tk = t2;
      }
      return rr < rad(1) - 0.06 ? wall(1) + 0.02 : wall(tk) - 0.03;
    };
    const soilAt = (x: number, z: number) => soilY((Math.atan2(z, x) + Math.PI * 2) % (Math.PI * 2), Math.hypot(x, z));
    {
      const A = 120;
      const S = 18;
      const posA: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= A; i++) {
        const th = (i / A) * Math.PI * 2;
        const outer = rad(th / (Math.PI * 2 * turns)) - 0.04;
        for (let j = 0; j <= S; j++) {
          const rr = outer * (1 - j / S);
          posA.push(Math.cos(th) * rr, soilY(th, rr), Math.sin(th) * rr);
        }
      }
      for (let i = 0; i < A; i++) for (let j = 0; j < S; j++) {
        const a0 = i * (S + 1) + j;
        const b0 = a0 + S + 1;
        idx.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
      sg.setAttribute('uv', new THREE.Float32BufferAttribute(posA.flatMap((_, q) => (q % 3 === 0 ? [posA[q], posA[q + 2]] : [])), 2));
      sg.setIndex(idx);
      sg.computeVertexNormals();
      add(sg, mapped(0xffffff, speckle('#4a3222', ['#3a2618', '#5d4030', '#2c1c12', '#6a4a35'], 900, [2, 5], [1, 1], 4), { side: THREE.DoubleSide }), herbs, { ink: null });
    }
    const n = 48;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const a = t * turns * Math.PI * 2;
      const rr = rad(t);
      const courses = Math.max(1, Math.round(wall(t) / 0.11));
      for (let c = 0; c < courses; c++) {
        const y = 0.055 + c * 0.11;
        inst(herbs, UNIT_BOX, M.stone, [Math.cos(a) * rr, y, Math.sin(a) * rr], [0.17, 0.1, 0.12], new THREE.Color(0xffffff).offsetHSL(0.02 * jitter(r, 1), 0, jitter(r, 0.1)), [jitter(r, 0.05), -a + Math.PI / 2 + jitter(r, 0.15), jitter(r, 0.05)]);
      }
    }
    // Herbs from the dry top to the moist bottom.
    const at = (t: number, inset = 0.17) => {
      const a = t * turns * Math.PI * 2;
      const rr = rad(t) - inset;
      return V(Math.cos(a) * rr, wall(t) - 0.02, Math.sin(a) * rr);
    };
    rosemary(k, herbs, V(0, soilAt(0, 0), 0));
    lavender(k, herbs, at(0.86, 0.12));
    thyme(k, herbs, at(0.74), 0.16);
    sage(k, herbs, at(0.62));
    chives(k, herbs, at(0.48));
    chamomile(k, herbs, at(0.36));
    basil(k, herbs, at(0.24));
    thyme(k, herbs, at(0.14), 0.12);
    // Marshmallow loves the damp foot of the spiral.
    marshmallow(k, herbs, V(0.95, 0, -0.75));
    marshmallow(k, herbs, V(1.25, 0, -0.35));
    tag(herbs, 'MARSHMALLOW', [1.2, 0, -0.75], -0.8);
    tag(herbs, 'ROSEMARY', [0.17, soilAt(0.17, 0.1), 0.1], 0.4);
    for (const [x, z, sz] of [[0.9, 0.8, 1], [1.15, 0.55, 0.75]] as const) {
      add(new THREE.CylinderGeometry(0.13 * sz, 0.09 * sz, 0.2 * sz, 16), M.terracotta, herbs, { at: [x, 0.1 * sz, z] });
      add(new THREE.TorusGeometry(0.13 * sz, 0.018, 6, 18), M.terracotta, herbs, { at: [x, 0.2 * sz, z], rot: [Math.PI / 2, 0, 0] });
      thyme(k, herbs, V(x, 0.2 * sz, z), 0.1 * sz);
    }
    pick(herbs, [2.4, 1.4, 2.4], [0.2, 0.7, 0]);
  }
}

export function buildPollinators(c: GardenCtx) {
  const { r, k, M, area, pick } = c;
  const pollinators = area('pollinators', 4.45, 3.15);
  {
    add(new THREE.CircleGeometry(1.3, 28), M.soil, pollinators, { at: [0, 0.008, 0], rot: [-Math.PI / 2, 0, 0], ink: null }).castShadow = false;
    for (let i = 0; i < 4; i++) sunflower(k, pollinators, V(-0.75 + i * 0.5, 0, -0.55 + jitter(r, 0.1)), Math.PI / 2 - 0.3 + jitter(r, 0.3));
    const zc = [0xff3d7f, 0xff8a2a, 0xffd23f, 0xd83a5a, 0xff6ad8];
    for (let i = 0; i < 6; i++) zinnia(k, pollinators, V(-0.9 + i * 0.36, 0, 0.15 + jitter(r, 0.1)), zc[i % zc.length]);
    for (let i = 0; i < 4; i++) cosmos(k, pollinators, V(-0.7 + i * 0.45, 0, 0.65 + jitter(r, 0.1)), [0xff8ad8, 0xffffff, 0xd84a9a][i % 3]);
    beeBalm(k, pollinators, V(-1.0, 0, 0.45), 0xe0283f);
    beeBalm(k, pollinators, V(0.95, 0, 0.5), 0xa04ad0);
    for (let i = 0; i < 3; i++) echinacea(k, pollinators, V(-0.45 + i * 0.45 + jitter(r, 0.06), 0, 0.98 + jitter(r, 0.06)));
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.2 + i * 0.15);
      alyssum(k, pollinators, V(Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18));
    }
    const hotel = new THREE.Group();
    hotel.position.set(1.15, 0, -0.2);
    hotel.rotation.y = -0.5;
    pollinators.add(hotel);
    box(0.07, 1.2, 0.07, M.cedarDark, hotel, { at: [0, 0.6, 0] });
    box(0.36, 0.42, 0.18, M.cedar, hotel, { at: [0, 1.36, 0], r: 0.01 });
    const roofG = new THREE.CylinderGeometry(0.01, 0.3, 0.14, 4, 1);
    roofG.rotateY(Math.PI / 4);
    add(roofG, M.roof, hotel, { at: [0, 1.64, 0], scale: [1, 1, 0.7] });
    const holes = mapped(0xffffff, canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#d8b878';
      ctx.fillRect(0, 0, 64, 64);
      for (let y = 4; y < 64; y += 8) for (let x = 4 + ((y / 8) % 2) * 4; x < 64; x += 8) {
        ctx.fillStyle = '#3a2410';
        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }));
    add(new THREE.PlaneGeometry(0.3, 0.36), holes, hotel, { at: [0, 1.36, 0.092], ink: null });
    pick(pollinators, [2.6, 2.2, 2.0], [0, 1.1, 0]);
  }
}
