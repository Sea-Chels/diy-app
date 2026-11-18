import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, box, canvasTex, label, leafGeo, leafMatrix, mapped, range, rng, speckle, tube, V, type V3 } from '../../../shared/scene/kit';
import { hex, PALETTE } from '../../../shared/theme';
import { Z0, WH, HOLE } from '../room';
import { floorTex } from '../textures';
import type { HomeCtx } from '../ctx';
import { MAT } from '../../../shared/scene/materials';

export function buildLiving(c: HomeCtx) {
  const { r, root, M, slab } = c;
  {
    const rug = canvasTex(256, 192, (ctx) => {
      ctx.fillStyle = '#26364f'; ctx.fillRect(0, 0, 256, 192);
      ctx.fillStyle = '#e9dcc0'; ctx.fillRect(14, 14, 228, 164);
      ctx.strokeStyle = '#c9584a'; ctx.lineWidth = 4;
      for (let x = 30; x < 240; x += 32) for (let y = 30; y < 170; y += 32) {
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.stroke();
      }
    });
    const rg = new THREE.PlaneGeometry(2.2, 1.6);
    rg.rotateX(-Math.PI / 2);
    const rugM = add(rg, mapped(0xffffff, rug, { halftone: 0.7 }), root, { at: [1.75, 0.006, 1.25], ink: null });
    rugM.castShadow = false;
    rugM.userData.crease = true;
    const fabric = toon(0xc96f4a);
    const fabricDark = toon(0xa95a3a);
    box(0.85, 0.3, 1.9, fabric, root, { at: [2.92, 0.27, 1.25], r: 0.04 });
    box(0.25, 0.48, 1.9, fabric, root, { at: [3.22, 0.66, 1.25], r: 0.06 });
    for (const sd of [-1, 1]) box(0.85, 0.36, 0.18, fabricDark, root, { at: [2.92, 0.5, 1.25 + sd * 0.87], r: 0.06 });
    for (const sd of [-1, 1]) box(0.6, 0.13, 0.76, fabric, root, { at: [2.78, 0.48, 1.25 + sd * 0.39], r: 0.05 });
    for (const sd of [-1, 1]) box(0.12, 0.3, 0.32, toon(hex(sd < 0 ? 'yellow' : 'cyan')), root, { at: [3.04, 0.68, 1.25 + sd * 0.55], rot: [0, 0, 0.25], r: 0.05 });
    for (const [lx, lz] of [[2.55, 0.35], [2.55, 2.15], [3.28, 0.35], [3.28, 2.15]]) add(new THREE.CylinderGeometry(0.025, 0.018, 0.12, 8), M.walnut, root, { at: [lx, 0.06, lz] });
    box(1.0, 0.04, 0.55, M.walnut, root, { at: [1.55, 0.42, 1.25], r: 0.012 });
    for (const [dx, dz] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) box(0.04, 0.4, 0.04, M.walnut, root, { at: [1.55 + dx, 0.2, 1.25 + dz], r: 0.008 });
    box(0.24, 0.04, 0.17, toon(0x3d6b8a), root, { at: [1.35, 0.46, 1.15], rot: [0, 0.2, 0], r: 0.005 });
    box(0.22, 0.035, 0.15, toon(0xd8a43a), root, { at: [1.35, 0.497, 1.15], rot: [0, -0.1, 0], r: 0.005 });
    add(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 14), toon(0xf6f3ec), root, { at: [1.8, 0.485, 1.32] });
    add(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 20), M.black, root, { at: [3.15, 0.012, 2.45] });
    add(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 8), M.black, root, { at: [3.15, 0.76, 2.45] });
    add(new THREE.CylinderGeometry(0.14, 0.2, 0.26, 20, 1, true), toon(0xfff1c4, { emissive: 0xffc870, emissiveIntensity: 0.45, side: THREE.DoubleSide }), root, { at: [3.15, 1.55, 2.45] });
    add(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 18), MAT.terracotta(), root, { at: [3.15, 0.16, -2.35] });
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 18), toon(0x4a3222), root, { at: [3.15, 0.31, -2.35], ink: null });
    tube([V(3.15, 0.3, -2.35), V(3.12, 0.9, -2.33), V(3.17, 1.5, -2.36)], 0.018, toon(0x6b4a30), root, { seg: 10 });
    const leafG = leafGeo({ shape: 'obovate', w: 0.62, bend: 0.25, cup: 0.15, thickness: 0.004 });
    const leafM = toon(0x3f7d3a, { side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) {
      const y = 0.75 + (i / 16) * 0.8;
      const a = i * 2.4;
      const out = V(Math.cos(a), 0.55 + (i / 16) * 0.4, Math.sin(a)).normalize();
      const at = V(3.15 + Math.cos(a) * 0.02, y, -2.35 + Math.sin(a) * 0.02);
      const leaf = new THREE.Mesh(leafG, leafM);
      leaf.matrixAutoUpdate = false;
      leaf.matrix.copy(leafMatrix(at, out, V(0, 1, 0).sub(out.clone().multiplyScalar(0.5)).normalize(), range(r, 0.24, 0.32)));
      leaf.castShadow = true;
      root.add(leaf);
    }
    for (const [x0, x1, col] of [[2.6, 2.95, PALETTE.cyan], [3.02, 3.36, PALETTE.pink]] as const) {
      slab([x0, 1.82, Z0], [x1, 2.25, Z0 + 0.03], M.walnut, root, 'thin');
      const art = canvasTex(64, 80, (ctx) => {
        ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 0, 64, 80);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(32, 34, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PALETTE.ink; ctx.fillRect(10, 58, 44, 4);
      });
      slab([x0 + 0.03, 1.85, Z0 + 0.03], [x1 - 0.03, 2.22, Z0 + 0.032], mapped(0xffffff, art), root, null);
    }
  }
}

/** Ceiling fan or light, hung from a cut-out patch of ceiling. */
export function buildLights(c: HomeCtx) {
  const { lidHooks, M, area, pick, slab, pivot, s } = c;
  const lightsA = area('lights');
  const FX = 1.55;
  const FZ = 1.6;
  const fanBlades = new THREE.Group();
  const bulbMats: THREE.Material[] = [];
  const lamp = new THREE.PointLight(0xffd59a, 0.9, 5, 1.2);
  {
    const l = lightsA;
    const ceilSec = mapped(0xffffff, canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#e9b9c8'; ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#b8935c'; ctx.fillRect(0, 0, 64, 8);
      for (let x = 0; x < 64; x += 26) { ctx.fillStyle = '#d9b07a'; ctx.fillRect(x, 8, 8, 48); }
      ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 56, 64, 8);
    }));
    const C = 0.2;
    // Drywall underside with a hole for the box, then joist-cut sides and a cut top.
    const sh = new THREE.Shape();
    [[-C, -C], [C, -C], [C, C], [-C, C]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.078, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    const under = new THREE.ShapeGeometry(sh, 16);
    under.rotateX(Math.PI / 2);
    add(under, M.trim, l, { at: [FX, WH, FZ], ink: null });
    slab([FX - C, WH + 0.07, FZ - C], [FX + C, WH + 0.08, FZ + C], M.cut, l, null);
    for (const [min, max] of [[[FX - C, WH, FZ + C - 0.002], [FX + C, WH + 0.08, FZ + C]], [[FX + C - 0.002, WH, FZ - C], [FX + C, WH + 0.08, FZ + C]], [[FX - C, WH, FZ - C], [FX + C, WH + 0.08, FZ - C + 0.002]], [[FX - C, WH, FZ - C], [FX - C + 0.002, WH + 0.08, FZ + C]]] as [V3, V3][]) slab(min, max, ceilSec, l, 'body');
    // Fan-rated box with its brace, open at the bottom.
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 8, 1, true), toon(0x6d7888, { shine: 0.6, metal: 0.5, side: THREE.DoubleSide }), l, { at: [FX, WH + 0.035, FZ], ink: null });
    add(new THREE.CircleGeometry(0.075, 8), M.dark, l, { at: [FX, WH + 0.069, FZ], rot: [Math.PI / 2, 0, 0], ink: null });
    slab([FX - C + 0.01, WH + 0.07, FZ - 0.015], [FX + C - 0.01, WH + 0.1, FZ + 0.015], M.steel, l, 'thin');
    // Wires drop out of the box when the canopy comes down.
    const wires = pivot(l, [FX, WH + 0.02, FZ]);
    for (const [col, dx] of [[M.wire.black, 0.02], [M.wire.white, -0.02], [M.wire.green, 0.0]] as const) {
      tube([V(0, 0, 0), V(dx * 1.5, -0.1, dx), V(dx * 0.6, -0.2, 0.012)], 0.004, col, wires, { seg: 10, ink: null });
    }
    wires.scale.y = 0.01;
    wires.visible = false;
    const hang = new THREE.Group();
    l.add(hang);
    if (s.ceiling === 'fan') {
      slab([FX - 0.06, WH - 0.012, FZ - 0.012], [FX + 0.06, WH, FZ + 0.012], M.steel, l, 'thin');
      const bronze = toon(0x5a4636, { shine: 0.5, metal: 0.4 });
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), bronze, l, { at: [FX, WH - 0.12, FZ] });
      add(new THREE.CylinderGeometry(0.06, 0.09, 0.07, 20), bronze, hang, { at: [FX, WH - 0.036, FZ] });
      add(new THREE.CylinderGeometry(0.12, 0.14, 0.11, 24), bronze, l, { at: [FX, WH - 0.27, FZ] });
      fanBlades.position.set(FX, WH - 0.28, FZ);
      l.add(fanBlades);
      for (let i = 0; i < 5; i++) {
        const arm = new THREE.Group();
        arm.rotation.y = (i / 5) * Math.PI * 2;
        fanBlades.add(arm);
        box(0.12, 0.012, 0.03, bronze, arm, { at: [0.16, -0.02, 0], r: 0.004 });
        box(0.42, 0.009, 0.12, M.walnut, arm, { at: [0.42, -0.025, 0], rot: [0.2, 0, 0], r: 0.004 });
      }
      const bulb = toon(0xfff3d2, { emissive: 0xffd88a, emissiveIntensity: 0.9 });
      bulbMats.push(bulb);
      add(new THREE.SphereGeometry(0.1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bulb, l, { at: [FX, WH - 0.33, FZ], scale: [1, 0.8, 1] });
      lamp.position.set(FX, WH - 0.7, FZ);
    } else {
      slab([FX - 0.1, WH - 0.01, FZ - 0.012], [FX + 0.1, WH, FZ + 0.012], M.steel, l, 'thin');
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), M.brass, hang, { at: [FX, WH - 0.01, FZ] });
      const drum = toon(0xf2e6c8, { emissive: 0xffc870, emissiveIntensity: 0.55, side: THREE.DoubleSide });
      bulbMats.push(drum);
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 32, 1, true), drum, hang, { at: [FX, WH - 0.09, FZ] });
      const diffuser = toon(0xfff6dc, { emissive: 0xffd88a, emissiveIntensity: 0.9 });
      bulbMats.push(diffuser);
      add(new THREE.CircleGeometry(0.235, 32), diffuser, hang, { at: [FX, WH - 0.16, FZ], rot: [Math.PI / 2, 0, 0], ink: null });
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 32), M.brass, hang, { at: [FX, WH - 0.012, FZ], ink: null });
      lamp.position.set(FX, WH - 0.4, FZ);
    }
    l.add(lamp);
    lidHooks.canopy = (k) => {
      hang.position.y = -0.2 * k;
      wires.visible = k > 0.02;
      wires.scale.y = Math.max(0.01, k);
    };
    pick(l, [FX - 0.6, WH - 0.45, FZ - 0.6], [FX + 0.6, WH + 0.09, FZ + 0.6]);
  }
  return { FX, FZ, fanBlades, bulbMats, lamp };
}

/** Paint stripping: a half-stripped dresser on a drop cloth. */
export function buildPaintCorner(c: HomeCtx) {
  const { r, lidHooks, M, area, pick, slab, pivot } = c;
  const paintA = area('paint');
  const drawer = new THREE.Group();
  {
    const p = paintA;
    const DX = -0.85;
    const DZ = 1.55;
    const cloth = canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = '#e8e1d0'; ctx.fillRect(0, 0, 128, 128);
      const rr = rng(12);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = ['#4f8f8a', '#ffffff', '#c98f55', '#2f4a6b'][Math.floor(rr() * 4)];
        ctx.beginPath(); ctx.arc(rr() * 128, rr() * 128, range(rr, 0.8, 3), 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(120,110,90,0.35)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(rr() * 128, 0); ctx.lineTo(rr() * 128, 128); ctx.stroke(); }
    }, [1.5, 1.2]);
    const cg = new THREE.PlaneGeometry(1.9, 1.5, 8, 6);
    const cp = cg.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.abs(cp.getX(i)) > 0.8 || Math.abs(cp.getY(i)) > 0.6 ? range(r, 0, 0.02) : 0);
    cg.computeVertexNormals();
    cg.rotateX(-Math.PI / 2);
    add(cg, mapped(0xffffff, cloth, { side: THREE.DoubleSide }), p, { at: [DX + 0.1, 0.005, DZ + 0.15], ink: null }).castShadow = false;
    const teal = canvasTex(128, 64, (ctx) => {
      ctx.fillStyle = '#4f8f8a'; ctx.fillRect(0, 0, 128, 64);
      const rr = rng(2);
      for (let i = 0; i < 18; i++) {
        const x = rr() * 128, y = rr() * 64, w = range(rr, 3, 9);
        ctx.fillStyle = '#f4efe4'; ctx.fillRect(x - 1, y - 1, w + 2, w * 0.6 + 2);
        ctx.fillStyle = '#c8955c'; ctx.fillRect(x, y, w, w * 0.6);
      }
    });
    const painted = mapped(0xffffff, teal);
    const stripped = mapped(0xffffff, canvasTex(256, 64, (ctx) => {
      // Left: bare wood. Right: paint bubbling up under stripper, white primer at the edge.
      ctx.fillStyle = '#c8955c'; ctx.fillRect(0, 0, 256, 64);
      ctx.strokeStyle = 'rgba(120,80,40,0.4)';
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(0, 5 + i * 9); ctx.bezierCurveTo(90, 8 + i * 9, 170, 2 + i * 9, 256, 6 + i * 9); ctx.stroke(); }
      const rr = rng(6);
      ctx.fillStyle = '#f4efe4';
      ctx.beginPath(); ctx.moveTo(118, 0);
      for (let y = 0; y <= 64; y += 8) ctx.lineTo(112 + rr() * 16, y);
      ctx.lineTo(256, 64); ctx.lineTo(256, 0); ctx.fill();
      ctx.fillStyle = '#4f8f8a';
      ctx.beginPath(); ctx.moveTo(132, 0);
      for (let y = 0; y <= 64; y += 8) ctx.lineTo(126 + rr() * 16, y);
      ctx.lineTo(256, 64); ctx.lineTo(256, 0); ctx.fill();
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = 'rgba(140,200,190,0.8)';
        ctx.beginPath(); ctx.arc(135 + rr() * 60, rr() * 64, range(rr, 2, 6), 0, Math.PI * 2); ctx.fill();
      }
    }));
    const W = 0.9;
    const D = 0.45;
    const front = DZ + D / 2;
    box(W, 0.74, D, painted, p, { at: [DX, 0.45, DZ], r: 0.01 });
    box(W + 0.04, 0.03, D + 0.03, M.oak, p, { at: [DX, 0.835, DZ], r: 0.008 });
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.05, 0.08, 0.05, painted, p, { at: [DX + lx * (W / 2 - 0.04), 0.04, DZ + lz * (D / 2 - 0.04)], r: 0.008 });
    slab([DX - 0.41, 0.6, front], [DX + 0.41, 0.79, front + 0.001], M.dark, p, null);
    drawer.position.set(DX, 0.69, front);
    p.add(drawer);
    box(0.84, 0.19, 0.022, stripped, drawer, { at: [0, 0, 0.011], r: 0.004 });
    slab([-0.4, -0.08, -0.4], [-0.39, 0.07, 0], M.oak, drawer, 'thin');
    slab([0.39, -0.08, -0.4], [0.4, 0.07, 0], M.oak, drawer, 'thin');
    slab([-0.4, -0.09, -0.4], [0.4, -0.08, 0], M.oak, drawer, null);
    slab([-0.4, -0.08, -0.41], [0.4, 0.07, -0.4], M.oak, drawer, 'thin');
    for (const sd of [-1, 1]) add(new THREE.SphereGeometry(0.02, 10, 8), M.walnut, drawer, { at: [sd * 0.22, 0, 0.032] });
    for (const y of [0.46, 0.23]) {
      box(0.84, 0.21, 0.022, painted, p, { at: [DX, y, front + 0.011], r: 0.004 });
      for (const sd of [-1, 1]) add(new THREE.SphereGeometry(0.02, 10, 8), M.walnut, p, { at: [DX + sd * 0.22, y, front + 0.032] });
    }
    lidHooks.drawer = (k) => (drawer.position.z = front + 0.3 * k);
    const gun = pivot(p, [DX + 0.62, 0.05, DZ + 0.55]);
    gun.rotation.y = -0.6;
    box(0.2, 0.08, 0.07, toon(0xf08a24), gun, { at: [0, 0.02, 0], r: 0.02 });
    add(new THREE.CylinderGeometry(0.025, 0.03, 0.12, 12), M.steel, gun, { at: [0.15, 0.02, 0], rot: [0, 0, Math.PI / 2] });
    box(0.05, 0.12, 0.05, M.black, gun, { at: [-0.06, -0.03, 0], rot: [0, 0, -0.3], r: 0.015 });
    const scraper = pivot(p, [DX + 0.3, 0.012, DZ + 0.62]);
    scraper.rotation.y = 0.4;
    add(new THREE.CylinderGeometry(0.014, 0.016, 0.13, 10), M.red, scraper, { at: [-0.07, 0, 0], rot: [0, 0, Math.PI / 2] });
    box(0.06, 0.004, 0.05, M.steel, scraper, { at: [0.03, -0.004, 0], r: 0.002 });
    const canTex = label([{ text: 'STRIPPER', size: 30, color: PALETTE.ink }, { text: 'citrus gel', size: 18, color: PALETTE.ink }], '#a3e635', 256, 96);
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 20), [mapped(0xffffff, canTex), M.steel, M.steel] as unknown as THREE.Material, p, { at: [DX - 0.7, 0.09, DZ + 0.6] });
    const brush = pivot(p, [DX - 0.45, 0.015, DZ + 0.7]);
    brush.rotation.y = 1.0;
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), M.oak, brush, { at: [-0.06, 0, 0], rot: [0, 0, Math.PI / 2] });
    box(0.06, 0.016, 0.05, toon(0x8a6a3a), brush, { at: [0.04, 0, 0], r: 0.004 });
    const curl = toon(0x4f8f8a, { side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      add(new THREE.TorusGeometry(0.018, 0.006, 4, 10, Math.PI * 1.4), curl, p, { at: [DX + range(r, -0.4, 0.5), 0.015, front + range(r, 0.05, 0.35)], rot: [range(r, 0, 3), range(r, 0, 3), 0] });
    }
    pick(p, [DX - 0.5, 0, DZ - D / 2], [DX + 0.5, 0.9, front + 0.05]);
    pick(p, [DX - 0.85, 0, front], [DX + 0.85, 0.15, DZ + 0.9]);
  }
}

/** Floor cutaway: planks lift off the underlayment. */
export function buildFloorCutaway(c: HomeCtx) {
  const { lidHooks, M, area, pick, slab, pivot, s } = c;
  const floorA = area('floor');
  const planks: THREE.Group[] = [];
  {
    const f = floorA;
    const under = { oak: 0xb5543c, lvp: 0x5d86b5, tile: 0x9a9a94 }[s.floor];
    const ux = (HOLE.x0 + HOLE.x1) / 2 + 0.1;
    slab([HOLE.x0, -0.016, HOLE.z0], [ux, -0.012, HOLE.z1], toon(under), f, null);
    const osb = mapped(0xffffff, speckle('#c9a36a', ['#a8834e', '#dcb87c', '#8f6a3c', '#e3c48e'], 500, [3, 9], [1, 1], 17));
    slab([ux, -0.018, HOLE.z0], [HOLE.x1, -0.014, HOLE.z1], osb, f, null);
    add(new THREE.CylinderGeometry(0.035, 0.035, HOLE.z1 - HOLE.z0 - 0.02, 16), toon(under), f, { at: [ux + 0.035, 0.022, (HOLE.z0 + HOLE.z1) / 2], rot: [Math.PI / 2, 0, 0] });
    const n = 3;
    const pw = (HOLE.z1 - HOLE.z0) / n;
    const len = HOLE.x1 - HOLE.x0;
    for (let i = 0; i < n; i++) {
      const tex = floorTex(s.floor);
      tex.repeat.set(tex.repeat.x * len, tex.repeat.y * pw);
      tex.offset.set(0.13 * i, 0.31 * i);
      const g = pivot(f, [HOLE.x0, 0, HOLE.z0 + pw * (i + 0.5)]);
      slab([0, -0.012, -pw / 2 + 0.001], [len, 0.0025, pw / 2 - 0.001], [M.oak, M.oak, mapped(0xffffff, tex, { halftone: 0.6 }), M.oak, M.oak, M.oak], g, 'thin');
      planks.push(g);
    }
    lidHooks.planks = (k) => planks.forEach((g, i) => {
      g.rotation.z = [0.32, 0.5, 0.22][i] * k;
      g.position.y = 0.02 * k * (i + 1);
    });
    box(0.5, 0.09, 0.2, mapped(0xffffff, label([{ text: 'FLOORING', size: 28, color: PALETTE.ink }], '#c69c64', 256, 64)), f, { at: [1.85, 0.045, 2.45], rot: [0, 0.15, 0], r: 0.006 });
    box(0.5, 0.09, 0.2, toon(0xc69c64), f, { at: [1.83, 0.135, 2.47], rot: [0, 0.05, 0], r: 0.006 });
    box(0.22, 0.04, 0.06, toon(0x2f2f2f), f, { at: [1.55, 0.02, 2.3], rot: [0, -0.3, 0], r: 0.006 });
    pick(f, [HOLE.x0 - 0.05, -0.05, HOLE.z0 - 0.05], [HOLE.x1 + 0.05, 0.15, HOLE.z1 + 0.05]);
  }
}
