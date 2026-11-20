import * as THREE from 'three';
import { glass, toon } from '../../../shared/toon';
import { add, box, canvasTex, tube, V, type V3, textured } from '../../../shared/scene/kit';
import { X0, X1, Z0, Z1, T, WH, WIN, DOOR } from '../room';
import type { HomeCtx } from '../ctx';
import { MAT } from '../../../shared/scene/materials';
import { C } from '../palette';
import { TONE } from '../../../shared/theme';

/** Outside: trim, eaves and gutters, downspout, hose bib, porch light. */
export function buildExterior(c: HomeCtx) {
  const { r, lidHooks, root, M, siding, area, pick, slab, pivot } = c;
  const XO = X0 - T; // outer face of the left wall
  const ZO = Z0 - T; // outer face of the back wall
  const OV = 0.3; // eave overhang
  const gutA = area('gutters');
  const extA = area('exterior');
  // Corner boards and exterior casings: plain trim (not part of an area).
  slab([XO - 0.022, 0, ZO - 0.022], [XO + 0.1, WH - 0.03, ZO], M.trim, root, 'thin');
  slab([XO - 0.022, 0, ZO], [XO, WH - 0.03, ZO + 0.1], M.trim, root, 'thin');
  for (const [min, max] of [
    [[WIN.x0 - 0.08, WIN.y0 - 0.04, ZO - 0.02], [WIN.x0, WIN.y1 + 0.08, ZO]],
    [[WIN.x1, WIN.y0 - 0.04, ZO - 0.02], [WIN.x1 + 0.08, WIN.y1 + 0.08, ZO]],
    [[WIN.x0 - 0.08, WIN.y1, ZO - 0.02], [WIN.x1 + 0.08, WIN.y1 + 0.08, ZO]],
    [[XO - 0.02, 0, DOOR.z0 - 0.08], [XO, DOOR.y1 + 0.08, DOOR.z0]],
    [[XO - 0.02, 0, DOOR.z1], [XO, DOOR.y1 + 0.08, DOOR.z1 + 0.08]],
    [[XO - 0.02, DOOR.y1, DOOR.z0 - 0.08], [XO, DOOR.y1 + 0.08, DOOR.z1 + 0.08]],
  ] as [V3, V3][]) slab(min, max, M.trim, root, 'thin');

  // Eaves: shingle top, white fascia and soffit, cut where the roof is sliced off.
  const shingles = textured(canvasTex(64, 64, (ctx) => {
    ctx.fillStyle = '#3d424e'; ctx.fillRect(0, 0, 64, 64);
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = '#525866'; ctx.fillRect(0, row * 16, 64, 12);
      for (let x = (row % 2) * 8; x < 64; x += 16) { ctx.fillStyle = '#2a2e37'; ctx.fillRect(x, row * 16, 1.5, 12); }
    }
  }, [12, 1]), { halftone: 0.6 });
  const soffit = toon(C.stucco);
  slab([XO - OV, WH - 0.03, ZO - OV], [X1, WH + 0.05, ZO], [M.cut, M.trim, shingles, soffit, M.cut, M.trim], gutA);
  slab([XO - OV, WH - 0.03, ZO], [XO, WH + 0.05, Z1], [M.cut, M.trim, shingles, soffit, M.cut, M.cut], gutA);

  // K-style-ish gutters hung on the fascia: bottom, outer lip and back, plus end caps.
  const gutterRun = (min: V3, max: V3, alongX: boolean) => {
    const [x0, y0, z0] = min;
    const [x1, y1, z1] = max;
    slab([x0, y0, z0], [x1, y0 + 0.012, z1], M.gutter, gutA, 'thin');
    if (alongX) {
      slab([x0, y0, z0], [x1, y1, z0 + 0.01], M.gutter, gutA, 'thin');
      slab([x0, y0, z1 - 0.008], [x1, y1 - 0.02, z1], M.gutter, gutA, 'thin');
    } else {
      slab([x0, y0, z0], [x0 + 0.01, y1, z1], M.gutter, gutA, 'thin');
      slab([x1 - 0.008, y0, z0], [x1, y1 - 0.02, z1], M.gutter, gutA, 'thin');
    }
  };
  const GY0 = WH - 0.14;
  const GY1 = WH - 0.03;
  gutterRun([XO - OV - 0.12, GY0, ZO - OV - 0.12], [X1 - 0.01, GY1, ZO - OV], true);
  gutterRun([XO - OV - 0.12, GY0, ZO - OV], [XO - OV, GY1, Z1 - 0.01], false);
  slab([X1 - 0.02, GY0, ZO - OV - 0.12], [X1 - 0.01, GY1, ZO - OV], M.gutter, gutA, 'thin');
  slab([XO - OV - 0.12, GY0, Z1 - 0.02], [XO - OV, GY1, Z1 - 0.01], M.gutter, gutA, 'thin');
  {
    const leafCols = C.fallLeaves.map((c) => toon(c));
    const lg = new THREE.BoxGeometry(0.06, 0.008, 0.035);
    for (let i = 0; i < 70; i++) {
      const x = XO - OV - 0.08 + r() * (X1 - XO + OV - 0.2);
      add(lg, leafCols[i % 4], gutA, { at: [x, GY0 + 0.016 + r() * 0.03, ZO - OV - 0.06 + (r() - 0.5) * 0.07], rot: [r() * 0.6, r() * 3, r() * 0.6], ink: null, shadow: false });
    }
  }
  // Gutter guard over the leafiest run; lifts on a hinge along the fascia.
  const guardHinge = pivot(gutA, [0, GY1 + 0.004, ZO - OV]);
  {
    const screen = textured(canvasTex(32, 32, (ctx) => {
      ctx.fillStyle = '#2d3138'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#8d949e';
      for (let y = 0; y < 32; y += 4) for (let x = (y % 8) / 2; x < 32; x += 4) ctx.fillRect(x, y, 2.5, 2.5);
    }, [20, 2]));
    slab([-3.05, -0.004, -0.125], [-1.25, 0.002, 0], screen, guardHinge, 'thin');
    lidHooks.gutterGuard = (k) => (guardHinge.rotation.x = 1.15 * k);
  }
  // Downspout: an offset from the gutter back to the wall, down the wall, then an extension out to a splash block.
  {
    const DX = XO + 0.32;
    const zg = ZO - OV - 0.06;
    const zw = ZO - 0.04;
    const yTop = WH - 0.44;
    box(0.075, 0.06, 0.06, M.gutter, gutA, { at: [DX, GY0 - 0.02, zg], r: 0.006 });
    const dy = GY0 - 0.03 - yTop;
    const dz = zg - zw;
    box(0.075, Math.hypot(dy, dz), 0.06, M.gutter, gutA, { at: [DX, (GY0 - 0.03 + yTop) / 2, (zg + zw) / 2], rot: [Math.atan2(dz, dy), 0, 0], r: 0.006 });
    box(0.075, yTop + 0.22, 0.06, M.gutter, gutA, { at: [DX, (yTop - 0.22) / 2, zw], r: 0.006 });
    for (const y of [0.4, 1.4]) slab([DX - 0.05, y, zw - 0.035], [DX + 0.05, y + 0.02, zw + 0.04], M.gutter, gutA, 'thin');
    box(0.075, 0.06, 0.12, M.gutter, gutA, { at: [DX, -0.25, zw - 0.03], rot: [-0.5, 0, 0], r: 0.006 });
    box(0.075, 0.06, 0.6, M.gutter, gutA, { at: [DX, -0.29, zw - 0.39], rot: [-0.04, 0, 0], r: 0.006 });
    slab([DX - 0.13, -0.35, zw - 1.0], [DX + 0.13, -0.31, zw - 0.66], M.concrete, gutA, 'thin');
    pick(gutA, [DX - 0.12, -0.35, zw - 1.0], [DX + 0.12, GY0, zw + 0.05]);
  }
  pick(gutA, [XO - OV - 0.14, GY0 - 0.04, ZO - OV - 0.14], [X1, WH + 0.08, ZO]);
  pick(gutA, [XO - OV - 0.14, GY0 - 0.04, ZO], [XO, WH + 0.08, Z1]);

  // Hose bib with a coiled hose, a porch light, a weatherproof outlet and a loose siding panel.
  const porchBulb = toon(C.bulb, { emissive: C.porchGlow, emissiveIntensity: 0.9 });
  {
    const e = extA;
    const HB = { y: 0.42, z: -1.75 };
    add(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16), M.copper, e, { at: [XO - 0.008, HB.y, HB.z], rot: [0, 0, Math.PI / 2] });
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 12), M.brass, e, { at: [XO - 0.055, HB.y, HB.z], rot: [0, 0, Math.PI / 2] });
    add(new THREE.CylinderGeometry(0.018, 0.016, 0.07, 12), M.brass, e, { at: [XO - 0.1, HB.y - 0.03, HB.z] });
    add(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 6), M.brass, e, { at: [XO - 0.07, HB.y + 0.035, HB.z] });
    add(new THREE.TorusGeometry(0.028, 0.007, 6, 14), M.red, e, { at: [XO - 0.07, HB.y + 0.058, HB.z], rot: [Math.PI / 2, 0, 0] });
    slab([XO - 0.03, 0.62, -1.38], [XO, 0.72, -1.12], toon(TONE.graphite), e, 'thin');
    slab([XO - 0.16, 0.66, -1.32], [XO - 0.03, 0.7, -1.18], toon(TONE.graphite), e, 'thin');
    const hose = MAT.hose();
    for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(0.2, 0.013, 8, 32), hose, e, { at: [XO - 0.05 - i * 0.026, 0.5, -1.25], rot: [0, Math.PI / 2, 0], scale: [1, 1.2, 1] });
    tube([V(XO - 0.1, HB.y - 0.07, HB.z), V(XO - 0.14, HB.y - 0.2, HB.z + 0.05), V(XO - 0.16, 0.18, -1.45), V(XO - 0.1, 0.27, -1.3)], 0.013, hose, e, { seg: 20 });
    const PLZ = DOOR.z0 - 0.24;
    slab([XO - 0.02, 1.62, PLZ - 0.06], [XO, 1.86, PLZ + 0.06], M.black, e, 'thin');
    slab([XO - 0.15, 1.82, PLZ - 0.08], [XO - 0.02, 1.86, PLZ + 0.08], M.black, e, 'thin');
    slab([XO - 0.13, 1.64, PLZ - 0.065], [XO - 0.03, 1.82, PLZ + 0.065], porchBulb, e, 'body');
    slab([XO - 0.14, 1.62, PLZ - 0.075], [XO - 0.02, 1.64, PLZ + 0.075], M.black, e, 'thin');
    // Weather-resistant GFCI under an in-use bubble cover.
    const OUTZ = DOOR.z0 - 0.45;
    slab([XO - 0.012, 0.42, OUTZ - 0.05], [XO, 0.58, OUTZ + 0.05], M.plate, e, 'thin');
    slab([XO - 0.018, 0.47, OUTZ - 0.025], [XO - 0.012, 0.53, OUTZ + 0.025], toon(C.stucco), e, null);
    slab([XO - 0.08, 0.4, OUTZ - 0.065], [XO - 0.012, 0.6, OUTZ + 0.065], glass({ tint: C.bubbleCover, streak: TONE.white, alpha: 0.28, streaks: 0.4 }), e, 'thin');
    // Loose siding panel over house wrap; it swings out from its top edge.
    const SP = { y0: 0.9, y1: 1.35, z0: -0.65, z1: 0.35 };
    const wrap = textured(canvasTex(128, 64, (ctx) => {
      ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#5b86b8'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('HOUSE WRAP', 8, 20); ctx.fillText('HOUSE WRAP', 60, 48);
    }));
    slab([XO - 0.005, SP.y0, SP.z0], [XO - 0.001, SP.y1, SP.z1], [M.cut, wrap, M.cut, M.cut, M.cut, M.cut], e, null);
    for (const z of [-0.45, -0.05, 0.25]) add(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 8), M.steel, e, { at: [XO - 0.007, SP.y1 - 0.03, z], rot: [0, 0, Math.PI / 2], ink: null });
    const spHinge = pivot(e, [XO - 0.007, SP.y1, 0]);
    slab([-0.012, SP.y0 - SP.y1, SP.z0], [0, 0, SP.z1], [M.cut, siding(SP.y0, SP.y1), M.cut, M.cut, M.cut, M.cut], spHinge, 'body');
    // It already sags a little when closed: that's the "loose" panel.
    lidHooks.sidingPanel = (k) => (spHinge.rotation.z = -0.07 - 0.88 * k);
    lidHooks.sidingPanel(0);
    pick(e, [XO - 0.35, -0.35, Z0 + 0.05], [XO, WH - 0.2, DOOR.z0 - 0.1]);
  }
  return { XO, ZO, OV, porchBulb };
}
