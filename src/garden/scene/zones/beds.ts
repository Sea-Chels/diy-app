import * as THREE from 'three';
import { lerp } from '../../../shared/tween';
import { inkLine, toon } from '../../../shared/toon';
import { add, box, canvasTex, jitter, label, mapped, range, speckle, woodTexture } from '../../../shared/scene/kit';
import { PALETTE } from '../../../shared/theme';
import { basil, corn, marigold, nasturtium, squash, tomato } from '../plants/fruiting';
import { cabbage, carrot, chard, kale, lettuce } from '../plants/greens';
import { V, UNIT_BOX, UNIT_CYL, LOW_SPHERE, corrugated, BW, BD, BH } from '../geometry';
import type { GardenCtx } from '../ctx';

export function buildBeds(c: GardenCtx) {
  const { r, k, lidHooks, M, area, pick, inst, tag, s } = c;
  function galvBed(g: THREE.Group, w: number, d: number, h: number, front?: THREE.Group): void {
    const sides: [number, number, number, number][] = [
      [0, -d / 2, 0, w],
      [-w / 2, 0, Math.PI / 2, d],
      [w / 2, 0, -Math.PI / 2, d],
    ];
    for (const [x, z, ry, len] of sides) add(corrugated(len, h), M.galv, g, [x, 0, z], { rot: [0, ry, 0] });
    add(corrugated(w, h), M.galv, front ?? g, front ? [0, 0, 0] : [0, 0, d / 2], { rot: [0, Math.PI, 0] });
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.07, h + 0.02, 0.07, M.galvDark, g, [(x * w) / 2, (h + 0.02) / 2, (z * d) / 2], { r: 0.012 });
    for (const [x, z, len, ry] of [[0, -d / 2, w, 0], [-w / 2, 0, d, Math.PI / 2], [w / 2, 0, d, Math.PI / 2]] as const) {
      add(UNIT_CYL, M.galvDark, g, [x, h, z], { rot: [0, ry, Math.PI / 2], scale: [0.016, len, 0.016] });
    }
    add(UNIT_CYL, M.galvDark, front ?? g, front ? [0, h, 0] : [0, h, d / 2], { rot: [0, 0, Math.PI / 2], scale: [0.016, w, 0.016] });
  }
  function soilTop(g: THREE.Group, w: number, d: number, y: number): void {
    add(UNIT_BOX, M.soil, g, [0, y - 0.03, 0], { scale: [w - 0.02, 0.06, d - 0.02], ink: null });
  }

  // Bed 1: the cutaway. Its front panel swings down to show what's inside.
  const bed = area('bed', -1.75, 0);
  const bedFront = new THREE.Group();
  bedFront.position.set(0, 0, BD / 2);
  bed.add(bedFront);
  galvBed(bed, BW, BD, BH, bedFront);
  pick(bed, BW, BH + 0.4, BD, [0, (BH + 0.4) / 2, 0]);
  {
    const iw = BW - 0.04;
    const id = BD - 0.04;
    type Layer = { name: string; h: number; mat: THREE.Material };
    const tex = (base: string, flecks: string[], n = 700, size: [number, number] = [2, 6]) => mapped(0xffffff, speckle(base, flecks, n, size, [3, 1], 21 + n));
    const LAYERS: Record<typeof s.fill, Layer[]> = {
      hugel: [
        { name: 'Logs', h: 0.22, mat: tex('#3c2818', ['#2a1a10', '#4a3424'], 300) },
        { name: 'Branches & twigs', h: 0.1, mat: tex('#5a3e28', ['#7a5638', '#3a2616', '#8a6a48'], 900, [3, 9]) },
        { name: 'Cardboard', h: 0.025, mat: M.cardboard },
        { name: 'Leaves & grass clippings', h: 0.085, mat: tex('#7a5a2a', ['#c08a3a', '#5a8a3a', '#9a6a2a', '#d0a040', '#6a9a3a'], 1100, [3, 7]) },
        { name: 'Compost', h: 0.07, mat: tex('#2e1f14', ['#1e140c', '#45301f', '#5a4a2a'], 900) },
        { name: 'Topsoil', h: 0.075, mat: M.soil },
      ],
      lasagna: [
        { name: 'Cardboard', h: 0.03, mat: M.cardboard },
        { name: 'Browns: straw & dry leaves', h: 0.1, mat: tex('#b08a4a', ['#d8b860', '#8a6a3a', '#c09a50'], 1100, [3, 9]) },
        { name: 'Greens: clippings & scraps', h: 0.08, mat: tex('#5a7a2a', ['#7aa83a', '#3a5a1a', '#c0a040', '#d86a3a'], 1100, [3, 7]) },
        { name: 'Browns', h: 0.1, mat: tex('#9a7a42', ['#c8a858', '#7a5a32'], 1100, [3, 9]) },
        { name: 'Greens', h: 0.07, mat: tex('#4f6f2a', ['#6a9a3a', '#3a5a1a', '#a08a3a'], 1100, [3, 7]) },
        { name: 'Compost', h: 0.09, mat: tex('#2e1f14', ['#1e140c', '#45301f', '#5a4a2a'], 900) },
        { name: 'Topsoil', h: 0.1, mat: M.soil },
      ],
      mix: [
        { name: 'Hardware cloth (gophers)', h: 0.012, mat: M.steel },
        { name: 'Soil mix (60/30/10)', h: 0.558, mat: tex('#3e2a1c', ['#2a1a10', '#5a4030', '#f4f2ea', '#e8e6de'], 1300, [1.5, 4]) },
      ],
    };
    let y = 0.01;
    // Twigs get their own batch so they can slide out when the front opens.
    const twigs = new THREE.Group();
    twigs.userData.batchRoot = true;
    bed.add(twigs);
    const labels = new THREE.Group();
    bed.add(labels);
    LAYERS[s.fill].forEach((L, i) => {
      add(UNIT_BOX, L.mat, bed, [0, y + L.h / 2, 0], { scale: [iw, L.h, id], ink: null });
      if (s.fill === 'hugel' && i === 0) {
        // Log ends with rings face the front.
        const rings = mapped(0xffffff, canvasTex(64, 64, (ctx) => {
          ctx.fillStyle = '#d8b07a';
          ctx.fillRect(0, 0, 64, 64);
          ctx.strokeStyle = '#9a6a3a';
          ctx.lineWidth = 2;
          for (let rr = 4; rr < 32; rr += 5) {
            ctx.beginPath();
            ctx.arc(32, 32, rr, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = '#5a3a20';
          ctx.beginPath();
          ctx.arc(32, 32, 31, 0, Math.PI * 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#4a2e18';
          ctx.stroke();
        }));
        const bark = mapped(0xffffff, woodTexture('#5a3e2a', '#3a2616', [1, 3]));
        for (const [x, rad] of [[-0.95, 0.1], [-0.55, 0.11], [-0.12, 0.1], [0.3, 0.11], [0.72, 0.1], [1.0, 0.08]] as const) {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, id, 14), [bark, rings, rings]);
          log.rotation.x = Math.PI / 2;
          log.position.set(x, y + rad, 0.005);
          log.castShadow = log.receiveShadow = true;
          bed.add(log);
        }
      }
      if (s.fill === 'hugel' && i === 1) {
        const twig = toon(0x6a4a30);
        for (let t = 0; t < 26; t++) {
          // Cut ends sit flush with the layer's face, so nothing pokes through the closed front panel.
          const len = range(r, 0.2, 0.5);
          const tilt = jitter(r, 0.6);
          const z = id / 2 + 0.005 - (len / 2) * Math.abs(Math.cos(tilt));
          inst(twigs, UNIT_CYL, twig, [range(r, -1.1, 1.1), y + range(r, 0.01, L.h - 0.01), z], [0.014, len, 0.014], 0xffffff, [Math.PI / 2 + tilt, jitter(r, 1.4), 0], null);
        }
      }
      // A comic caption per layer, shown when the front is open.
      {
        const tx = label([{ text: L.name, size: 30, color: PALETTE.ink }], '#fff7d6', 512, 64);
        const count = LAYERS[s.fill].length;
        const ly = count === 2 ? 0.12 + i * 0.3 : 0.06 + i * (0.62 / (count - 1));
        const plate = add(new THREE.PlaneGeometry(0.62, 0.0775), new THREE.MeshBasicMaterial({ map: tx }), labels, [BW / 2 + 0.42, ly, BD / 2 + 0.06], { ink: 'thin' });
        plate.castShadow = false;
        labels.add(inkLine([V(BW / 2 + 0.11, ly, BD / 2 + 0.06), V(BW / 2 - 0.12, y + L.h / 2, BD / 2 + 0.01)], 2));
      }
      y += L.h;
    });
    labels.scale.setScalar(0.001);
    labels.userData.labels = true;
    lidHooks.bedFront = (t) => {
      bedFront.rotation.x = 1.5 * t;
      twigs.position.z = 0.16 * t;
      labels.scale.setScalar(Math.max(0.001, t));
    };
  }
  {
    const top = BH - 0.03;
    for (let i = 0; i < 4; i++) chard(k, bed, V(-0.95 + i * 0.32, top, -0.32), [0xe0344b, 0xffc21a, 0xff7ad8, 0xe0344b][i]);
    for (let i = 0; i < 3; i++) kale(k, bed, V(0.4 + i * 0.32, top, -0.3));
    for (let i = 0; i < 7; i++) lettuce(k, bed, V(-1.0 + i * 0.3, top, 0.05), { red: i % 2 === 1 });
    for (let i = 0; i < 12; i++) carrot(k, bed, V(-1.05 + i * 0.19, top, 0.36));
    tag(bed, 'CHARD', [-1.1, top, -0.05]);
    tag(bed, 'CARROTS', [1.08, top, 0.42]);
  }

  // Bed 2: the kitchen bed — tomatoes, basil, marigolds and nasturtiums.
  const kitchen = area('kitchen', 1.75, 0);
  galvBed(kitchen, BW, BD, BH);
  soilTop(kitchen, BW, BD, BH - 0.02);
  pick(kitchen, BW, 1.6, BD, [0, 0.8, 0]);
  {
    const top = BH - 0.03;
    for (let i = 0; i < 3; i++) tomato(k, kitchen, V(-0.75 + i * 0.75, top, -0.22), { cage: true, cageMat: M.steel });
    for (let i = 0; i < 4; i++) basil(k, kitchen, V(-1.0 + i * 0.66, top, 0.18));
    for (let i = 0; i < 3; i++) marigold(k, kitchen, V(-0.66 + i * 0.66, top, 0.32));
    nasturtium(k, kitchen, V(-1.05, top, 0.42));
    nasturtium(k, kitchen, V(1.05, top, 0.42));
    tag(kitchen, 'BASIL', [-0.7, top, 0.5]);
    tag(kitchen, 'TOMATO', [0.35, top, 0.05]);
  }

  // Bed 3: cedar bed under a hoop tunnel.
  const tunnel = area('tunnel', -1.75, 2.45);
  {
    const H = 0.44;
    const plank = (x: number, z: number, len: number, ry: number) => {
      for (let i = 0; i < 3; i++) box(len, 0.14, 0.04, M.cedar, tunnel, [x, 0.075 + i * 0.145, z], { rot: [0, ry, 0], r: 0.006 });
    };
    plank(0, -BD / 2, BW, 0);
    plank(0, BD / 2, BW, 0);
    plank(-BW / 2, 0, BD - 0.08, Math.PI / 2);
    plank(BW / 2, 0, BD - 0.08, Math.PI / 2);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.09, H + 0.12, 0.09, M.cedarDark, tunnel, [(x * BW) / 2, (H + 0.12) / 2, (z * BD) / 2], { r: 0.01 });
    soilTop(tunnel, BW, BD, H - 0.02);
    const top = H - 0.03;
    for (let i = 0; i < 4; i++) cabbage(k, tunnel, V(-0.9 + i * 0.6, top, -0.22));
    for (let i = 0; i < 5; i++) lettuce(k, tunnel, V(-0.96 + i * 0.48, top, 0.25), { red: i % 2 === 0 });
    const R = 0.56;
    for (const x of [-1.05, -0.35, 0.35, 1.05]) add(new THREE.TorusGeometry(R, 0.012, 6, 32, Math.PI), M.pvc, tunnel, [x, H, 0], { rot: [0, Math.PI / 2, 0] });
    const L = 2.2;
    const coverGeo = new THREE.CylinderGeometry(R + 0.02, R + 0.02, L, 28, 12, true, -Math.PI / 2, Math.PI);
    coverGeo.rotateZ(Math.PI / 2);
    {
      const pos = coverGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const sag = 1 - 0.05 * Math.abs(Math.sin(((x + L / 2) / 0.7) * Math.PI));
        pos.setY(i, pos.getY(i) * sag);
        pos.setZ(i, pos.getZ(i) * sag);
      }
      coverGeo.translate(-L / 2, 0, 0);
      coverGeo.computeVertexNormals();
    }
    const cover = new THREE.Group();
    cover.position.set(L / 2, H, 0);
    tunnel.add(cover);
    const cloth = new THREE.Mesh(coverGeo, M.cloth);
    cloth.renderOrder = 2;
    cover.add(cloth);
    const roll = add(new THREE.TorusGeometry(R + 0.04, 0.045, 8, 32, Math.PI), M.cloth, tunnel, [L / 2 - L, H, 0], { rot: [0, Math.PI / 2, 0], ink: null });
    roll.renderOrder = 2;
    for (const x of [-0.8, 0, 0.8]) box(0.2, 0.06, 0.12, toon(0xb39a6a), tunnel, [x, H + 0.03, R + 0.06], { r: 0.03 });
    lidHooks.rowCover = (t) => {
      const sx = lerp(1, 0.2, t);
      cover.scale.x = sx;
      roll.position.x = L / 2 - L * sx;
    };
    pick(tunnel, BW, 1.1, BD, [0, 0.55, 0]);
    tag(tunnel, 'CABBAGE', [1.1, top, 0.45]);
  }
}

export function buildSisters(c: GardenCtx) {
  const { k, M, area, pick } = c;
  const sisters = area('sisters', -1.1, -2.6);
  {
    add(new THREE.CircleGeometry(1.45, 40), M.soil, sisters, [0, 0.008, 0], { rot: [-Math.PI / 2, 0, 0], ink: null }).castShadow = false;
    const hills: [number, number][] = [[0, -0.3], [-0.85, 0.45], [0.8, 0.5]];
    hills.forEach(([hx, hz], hi) => {
      const mound = add(LOW_SPHERE, M.soil, sisters, [hx, 0, hz], { scale: [0.42, 0.13, 0.42], ink: 'thin' });
      mound.castShadow = false;
      for (let c = 0; c < 4; c++) {
        const a = (c / 4) * 6.28 + hi;
        corn(k, sisters, V(hx + Math.cos(a) * 0.16, 0.1, hz + Math.sin(a) * 0.16), { beans: c % 2 === 0 });
      }
      const out = Math.atan2(hz, hx);
      squash(k, sisters, V(hx + Math.cos(out) * 0.3, 0.06, hz + Math.sin(out) * 0.3), [out + 0.5, out - 0.9]);
    });
    pick(sisters, 2.6, 2.0, 2.4, [0, 1.0, 0]);
  }
}
