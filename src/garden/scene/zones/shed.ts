import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, box, jitter, label, mapped, tube, UNIT_BOX, V } from '../../../shared/scene/kit';
import { climber } from '../plants/flowers';
import { marigold, nasturtium } from '../plants/fruiting';
import { PUMPKIN } from '../plants/kit';
import { UNIT_CYL, LOW_SPHERE, JAR } from '../geometry';
import type { GardenCtx } from '../ctx';

export function buildToolFence(c: GardenCtx) {
  const { r, k, toolSwing, M, area, pick, inst } = c;
  const tools = area('tools', 0.9, -4.55);
  {
    for (let x = -3.6; x < 4.95; x += 0.155) {
      const h = 1.55 + (Math.round(x / 0.155) % 2 ? 0 : 0.03);
      inst(tools, UNIT_BOX, M.cedar, [x, h / 2, 0], [0.14, h, 0.022], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.05)));
    }
    for (const y of [0.3, 1.3]) inst(tools, UNIT_BOX, M.cedarDark, [0.65, y, -0.04], [8.6, 0.09, 0.04]);
    for (let x = -3.6; x < 5; x += 2.2) box(0.1, 1.7, 0.1, M.cedarDark, tools, { at: [x, 0.85, -0.08], r: 0.01 });
    box(1.9, 0.07, 0.04, M.cedarDark, tools, { at: [0.0, 1.32, 0.04], r: 0.008 });
    const hang = (x: number, build: (g: THREE.Group) => void, tilt = 0) => {
      const g = new THREE.Group();
      g.position.set(x, 1.32, 0.08);
      g.rotation.z = tilt;
      tools.add(g);
      add(UNIT_CYL, M.steel, g, { at: [0, 0, -0.02], rot: [Math.PI / 2, 0, 0], scale: [0.008, 0.08, 0.008], ink: null });
      build(g);
      toolSwing.push(g);
    };
    hang(-0.75, (g) => {
      add(new THREE.TorusGeometry(0.05, 0.012, 6, 16), M.handle, g, { at: [0, 0.0, 0] });
      add(UNIT_CYL, M.handle, g, { at: [0, -0.45, 0], scale: [0.016, 0.85, 0.016] });
      box(0.19, 0.28, 0.012, M.blade, g, { at: [0, -0.98, 0], r: 0.02 });
    });
    hang(-0.4, (g) => {
      add(UNIT_CYL, M.handle, g, { at: [0, -0.62, 0], scale: [0.014, 1.25, 0.014] });
      box(0.36, 0.03, 0.03, M.steel, g, { at: [0, -1.26, 0], r: 0.008 });
      for (let t = 0; t < 12; t++) add(UNIT_CYL, M.steel, g, { at: [-0.165 + t * 0.03, -1.3, 0.012], scale: [0.004, 0.06, 0.004], ink: null });
    });
    hang(-0.08, (g) => {
      add(UNIT_CYL, M.handle, g, { at: [0, -0.6, 0], scale: [0.014, 1.2, 0.014] });
      box(0.15, 0.1, 0.01, M.blade, g, { at: [0, -1.22, 0.03], rot: [0.5, 0, 0], r: 0.008 });
    });
    // Loppers: two long handles, crossing blades.
    hang(0.3, (g) => {
      for (const s2 of [-1, 1]) {
        add(UNIT_CYL, M.red, g, { at: [s2 * 0.05, -0.3, 0], rot: [0, 0, s2 * 0.12], scale: [0.013, 0.5, 0.013] });
        box(0.03, 0.15, 0.008, M.blade, g, { at: [-s2 * 0.012, -0.62, 0.008 * s2], rot: [0, 0, -s2 * 0.25], r: 0.004 });
      }
    });
    hang(0.6, (g) => {
      for (const s2 of [-1, 1]) add(UNIT_CYL, M.red, g, { at: [s2 * 0.018, -0.07, 0], rot: [0, 0, s2 * 0.18], scale: [0.012, 0.13, 0.012] });
      box(0.02, 0.07, 0.006, M.blade, g, { at: [0, -0.17, 0.004], r: 0.003 });
    });
    hang(0.85, (g) => {
      add(UNIT_CYL, M.handle, g, { at: [0, -0.07, 0], scale: [0.016, 0.13, 0.016] });
      add(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI), M.blade, g, { at: [0, -0.2, -0.0], scale: [0.7, 1.4, 0.35], rot: [0, 0, 0] });
    });
    const can = new THREE.Group();
    can.position.set(1.4, 0, 0.35);
    can.rotation.y = -0.5;
    tools.add(can);
    add(new THREE.CylinderGeometry(0.12, 0.13, 0.26, 18), M.galv, can, { at: [0, 0.13, 0] });
    tube([V(0.1, 0.06, 0), V(0.22, 0.2, 0), V(0.3, 0.3, 0)], 0.014, M.galv, can);
    add(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), M.galv, can, { at: [-0.02, 0.26, 0] });
    const wb = new THREE.Group();
    wb.position.set(-0.3, 0, 0.75);
    wb.rotation.y = 0.35;
    tools.add(wb);
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 18), toon(0x2a2a2e), wb, { at: [0.55, 0.15, 0], rot: [Math.PI / 2, 0, 0] });
    const tray = new THREE.CylinderGeometry(0.34, 0.22, 0.24, 4, 1, true);
    tray.rotateY(Math.PI / 4);
    tray.scale(1.3, 1, 0.9);
    add(tray, toon(0x2f7a5a, { shine: 0.4, side: THREE.DoubleSide }), wb, { at: [0.1, 0.42, 0] });
    for (const z of [-0.18, 0.18]) {
      add(UNIT_CYL, M.steel, wb, { at: [-0.15, 0.3, z], rot: [0, 0, 1.25], scale: [0.015, 1.1, 0.015] });
      add(UNIT_CYL, M.steel, wb, { at: [-0.15, 0.15, z], scale: [0.012, 0.3, 0.012] });
    }
    // Clematis climbing the fence on the left.
    climber(k, tools, [V(-3.4, 0, 0.06), V(-3.1, 0.7, 0.07), V(-2.6, 1.3, 0.06), V(-2.0, 1.45, 0.07), V(-1.5, 1.2, 0.06)], { leaf: 0x3f7a3a, flowers: [0x8a5ad8, 0xb07ae8], petals: 6, flowerSize: 0.05 });
    pick(tools, [2.4, 1.7, 1.4], [0.0, 0.85, 0.5]);
  }
}

export function buildPantry(c: GardenCtx) {
  const { r, k, lidHooks, white, whiteShiny, M, area, pick, inst } = c;
  const pantry = area('pantry', -4.25, -3.15);
  {
    const W = 2.0;
    const D = 1.6;
    const H = 2.05;
    const doorW = 1.1;
    const doorH = 1.8;
    box(W + 0.1, 0.12, D + 0.1, M.stone, pantry, { at: [0, 0.06, 0], r: 0.01 });
    const y0 = 0.12;
    box(0.06, H, D, M.shedWall, pantry, { at: [-W / 2, y0 + H / 2, 0], r: 0.005 });
    box(0.06, H, D, M.shedWall, pantry, { at: [W / 2, y0 + H / 2, 0], r: 0.005 });
    box(W, H, 0.06, M.shedWall, pantry, { at: [0, y0 + H / 2, -D / 2], r: 0.005 });
    const sideW = (W - doorW) / 2;
    box(sideW, H, 0.06, M.shedWall, pantry, { at: [-W / 2 + sideW / 2, y0 + H / 2, D / 2], r: 0.005 });
    box(sideW, H, 0.06, M.shedWall, pantry, { at: [W / 2 - sideW / 2, y0 + H / 2, D / 2], r: 0.005 });
    box(doorW, H - doorH, 0.06, M.shedWall, pantry, { at: [0, y0 + doorH + (H - doorH) / 2, D / 2], r: 0.005 });
    const gable = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, 0.62)]);
    const gGeo = new THREE.ExtrudeGeometry(gable, { depth: 0.05, bevelEnabled: false });
    add(gGeo, M.shedWall, pantry, { at: [0, y0 + H, D / 2 - 0.05] });
    add(gGeo, M.shedWall, pantry, { at: [0, y0 + H, -D / 2] });
    const pitch = Math.atan2(0.62, W / 2);
    const slope = Math.hypot(0.62, W / 2) + 0.2;
    for (const sd of [-1, 1]) {
      box(slope, 0.05, D + 0.3, M.roof, pantry, { at: [sd * (W / 4 + 0.05), y0 + H + 0.33, 0], rot: [0, 0, -sd * pitch], r: 0.01 });
    }
    box(0.08, 0.08, D + 0.34, M.trim, pantry, { at: [0, y0 + H + 0.66, 0], r: 0.01 });
    for (const x of [-doorW / 2 - 0.04, doorW / 2 + 0.04]) box(0.07, doorH + 0.06, 0.03, M.trim, pantry, { at: [x, y0 + doorH / 2, D / 2 + 0.03], r: 0.008 });
    box(doorW + 0.15, 0.07, 0.03, M.trim, pantry, { at: [0, y0 + doorH + 0.04, D / 2 + 0.03], r: 0.008 });
    const sign = add(new THREE.BoxGeometry(0.62, 0.16, 0.02), [M.trim, M.trim, M.trim, M.trim, mapped(0xffffff, label([{ text: 'PANTRY', size: 54, color: '#2a3a4a' }], '#f1ece0', 384, 100)), M.trim] as unknown as THREE.Material, pantry, { at: [0, y0 + H + 0.22, D / 2 + 0.02] });
    sign.castShadow = true;
    // Doors swing out from the outer edges.
    const doors: THREE.Group[] = [];
    for (const sd of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(sd * doorW / 2, y0, D / 2 + 0.03);
      pantry.add(hinge);
      const leaf = new THREE.Group();
      hinge.add(leaf);
      box(doorW / 2 - 0.01, doorH, 0.04, M.shedWall, leaf, { at: [-sd * (doorW / 4), doorH / 2, 0], r: 0.006 });
      for (const y of [0.25, doorH - 0.25]) box(doorW / 2 - 0.06, 0.08, 0.02, M.trim, leaf, { at: [-sd * (doorW / 4), y, 0.03], r: 0.006 });
      box(0.07, doorH - 0.5, 0.02, M.trim, leaf, { at: [-sd * (doorW / 4), doorH / 2, 0.03], rot: [0, 0, sd * 0.55], r: 0.006 });
      add(UNIT_CYL, M.galvDark, leaf, { at: [-sd * (doorW / 2 - 0.06), doorH * 0.5, 0.05], scale: [0.012, 0.16, 0.012] });
      doors.push(hinge);
      hinge.userData.side = sd;
    }
    lidHooks.shedDoors = (t) => doors.forEach((d) => (d.rotation.y = d.userData.side * 1.95 * t));
    // Inside: shelves of jars, crates, garlic and herbs drying.
    const shelfX = 0;
    for (const [y, z, w] of [[0.55, -D / 2 + 0.2, W - 0.14], [1.0, -D / 2 + 0.2, W - 0.14], [1.45, -D / 2 + 0.2, W - 0.14]] as const) {
      box(w, 0.03, 0.3, M.weathered, pantry, { at: [shelfX, y0 + y, z], r: 0.004 });
    }
    for (const x of [-W / 2 + 0.25, W / 2 - 0.25]) box(0.04, 1.5, 0.04, M.weathered, pantry, { at: [x, y0 + 0.75, -D / 2 + 0.07] });
    const contents = [0xd83a2a, 0x7a9a3a, 0xf3a43a, 0x7a2a5a, 0x5aa04a, 0xe8d08a, 0xc8402a, 0xb04a7a];
    for (const y of [0.565, 1.015, 1.465]) {
      for (let i = 0; i < 14; i++) {
        const x = -W / 2 + 0.2 + i * 0.115;
        const z = -D / 2 + 0.2 + jitter(r, 0.04);
        const col = contents[Math.floor(r() * contents.length)];
        inst(pantry, JAR, whiteShiny, [x, y0 + y, z], [1, 1, 1], col);
        inst(pantry, UNIT_CYL, M.brass, [x, y0 + y + 0.137, z], [0.036, 0.016, 0.036], 0xffffff, [0, 0, 0], null);
      }
    }
    const crate = (x: number, z: number, col: number, n: number, sz: number) => {
      box(0.42, 0.24, 0.32, M.weathered, pantry, { at: [x, y0 + 0.12, z], r: 0.01 });
      for (let i = 0; i < n; i++) inst(pantry, LOW_SPHERE, white, [x + jitter(r, 0.15), y0 + 0.25 + r() * 0.03, z + jitter(r, 0.1)], [sz, sz * 0.8, sz * 0.9], new THREE.Color(col).offsetHSL(0, 0, jitter(r, 0.05)));
    };
    crate(-0.55, D / 2 - 0.55, 0xb08a5a, 10, 0.045);
    crate(-0.55, D / 2 - 0.95, 0xd8a24a, 10, 0.04);
    inst(pantry, PUMPKIN, white, [0.6, y0 + 0.1, D / 2 - 0.6], [0.14, 0.14, 0.14], 0xe8a85a);
    inst(pantry, PUMPKIN, white, [0.7, y0 + 0.08, D / 2 - 0.95], [0.11, 0.11, 0.11], 0x5a7a3a);
    box(W - 0.1, 0.06, 0.06, M.weathered, pantry, { at: [0, y0 + H - 0.08, 0.1] });
    for (let i = 0; i < 5; i++) {
      const x = -0.7 + i * 0.35;
      inst(pantry, UNIT_CYL, white, [x, y0 + H - 0.2, 0.1], [0.004, 0.2, 0.004], 0x8a7a5a, [0, 0, 0], null);
      if (i % 2 === 0) for (let j = 0; j < 5; j++) inst(pantry, LOW_SPHERE, white, [x + jitter(r, 0.02), y0 + H - 0.34 - j * 0.07, 0.1], [0.032, 0.038, 0.032], 0xf0e6d6);
      else inst(pantry, new THREE.ConeGeometry(1, 1, 8), white, [x, y0 + H - 0.4, 0.1], [0.06, 0.24, 0.06], [0x6a8a5a, 0x8a9a7a][i % 2], [Math.PI, 0, 0]);
    }
    // A window with a flower box on the side facing the garden.
    box(0.05, 0.55, 0.65, toon(0x9fd8f0, { shine: 0.9 }), pantry, { at: [W / 2 + 0.01, y0 + 1.35, 0.1], r: 0.005 });
    box(0.07, 0.62, 0.72, M.trim, pantry, { at: [W / 2 + 0.005, y0 + 1.35, 0.1], r: 0.008 });
    box(0.18, 0.16, 0.7, M.cedar, pantry, { at: [W / 2 + 0.11, y0 + 0.98, 0.1], r: 0.01 });
    nasturtium(k, pantry, V(W / 2 + 0.11, y0 + 1.05, -0.12));
    marigold(k, pantry, V(W / 2 + 0.11, y0 + 1.05, 0.18), 0xffc21a);
    pick(pantry, [W + 0.2, H + 0.7, D + 0.2], [0, (H + 0.7) / 2, 0]);
    // Gutter and downspout to the rain barrel (part of the water area visually).
    add(UNIT_CYL, M.galv, pantry, { at: [W / 2 + 0.16, y0 + H - 0.05, 0], rot: [Math.PI / 2, 0, 0], scale: [0.045, D + 0.3, 0.045] });
    tube([V(W / 2 + 0.16, y0 + H - 0.05, D / 2 + 0.1), V(W / 2 + 0.18, y0 + H - 0.4, D / 2 + 0.14), V(W / 2 + 0.3, 1.3, D / 2 + 0.36), V(W / 2 + 0.3, 1.12, D / 2 + 0.36)], 0.035, M.galv, pantry, { radial: 8 });
  }
}
