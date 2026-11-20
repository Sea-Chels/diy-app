import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, box, canvasTex, label, rng, speckle, tube, V, type V3, textured } from '../../../shared/scene/kit';
import { hex, PALETTE, TONE } from '../../../shared/theme';
import { X0, Z0, T, DOOR } from '../room';
import type { HomeCtx } from '../ctx';
import { C } from '../palette';

/** Left wall: shut-offs, outlets, a hole, the front door. */
export function buildLeftWall(c: HomeCtx) {
  const { lidHooks, M, area, pick, slab, pivot, plateWith } = c;
  const utility = area('utility');
  const outlets = area('outlets');
  const wallA = area('wall');
  const doorA = area('door');
  const PZ = -0.08;
  const tripped = new THREE.Group();
  {
    const u = utility;
    box(0.08, 0.66, 0.38, toon(TONE.alloy, { shine: 0.5, metal: 0.4 }), u, { at: [X0 + 0.04, 1.47, PZ], r: 0.008 });
    slab([X0 + 0.08, 1.16, PZ - 0.17], [X0 + 0.084, 1.78, PZ + 0.17], toon(C.panelIn, { shine: 0.4 }), u, null);
    box(0.03, 0.07, 0.16, M.black, u, { at: [X0 + 0.095, 1.71, PZ], r: 0.004 });
    for (let row = 0; row < 8; row++) {
      for (const sd of [-1, 1]) {
        const y = 1.62 - row * 0.055;
        const isTripped = row === 3 && sd > 0;
        const g = isTripped ? tripped : new THREE.Group();
        g.position.set(X0 + 0.09, y, PZ + sd * 0.055);
        u.add(g);
        box(0.014, 0.045, 0.07, M.black, g, { r: 0.003, ink: null });
        box(0.014, 0.016, 0.014, isTripped ? toon(C.tripped) : toon(TONE.graphite), g, { at: [0.01, 0, isTripped ? 0 : -sd * 0.012], r: 0.003, ink: null });
      }
    }
    tripped.userData.sd = 1;
    // Panel door with the circuit directory inside.
    const hinge = pivot(u, [X0 + 0.085, 1.47, PZ - 0.19]);
    slab([0, -0.33, 0], [0.01, 0.33, 0.38], toon(C.satinMetal, { shine: 0.5, metal: 0.4 }), hinge, 'thin');
    slab([-0.002, -0.2, 0.06], [0, 0.22, 0.32], textured(label([{ text: 'CIRCUITS', size: 22, color: '#222' }, { text: '1 Kitchen 20A', size: 15, color: '#444' }, { text: '2 Bath GFCI 20A', size: 15, color: '#444' }, { text: '3 Living 15A', size: 15, color: '#444' }], '#f4f1e6', 128, 192)), hinge, null);
    box(0.012, 0.04, 0.015, M.black, hinge, { at: [0.012, 0, 0.35], r: 0.003 });
    lidHooks.panelDoor = (k) => (hinge.rotation.y = 1.9 * k);
    // Main water line up through the floor, with a quarter-turn shut-off and a tag.
    tube([V(X0 + 0.07, -0.05, PZ + 0.02), V(X0 + 0.07, 0.68, PZ + 0.02), V(X0 + 0.04, 0.76, PZ + 0.02), V(X0, 0.77, PZ + 0.02)], 0.016, M.copper, u, { seg: 24 });
    box(0.05, 0.08, 0.05, M.brass, u, { at: [X0 + 0.07, 0.42, PZ + 0.02], r: 0.01 });
    box(0.03, 0.02, 0.16, M.red, u, { at: [X0 + 0.11, 0.44, PZ + 0.02], r: 0.006 });
    const tag = add(new THREE.PlaneGeometry(0.14, 0.06), new THREE.MeshBasicMaterial({ map: label([{ text: 'MAIN WATER', size: 34, color: PALETTE.ink }], PALETTE.yellow, 256, 96) }), u, { at: [X0 + 0.003, 0.58, PZ + 0.13], rot: [0, Math.PI / 2, 0] });
    tag.castShadow = false;
    // Smoke/CO alarm high on the wall and the thermostat by the fridge.
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 24), M.plate, u, { at: [X0 + 0.018, 2.36, PZ], rot: [0, 0, Math.PI / 2] });
    add(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: C.ledOn }), u, { at: [X0 + 0.036, 2.36, PZ + 0.03], ink: null });
    box(0.11, 0.11, 0.025, M.plate, u, { at: [2.78, 1.45, Z0 + 0.013], r: 0.012 });
    box(0.07, 0.045, 0.004, toon(C.display, { emissive: hex('cyan'), emissiveIntensity: 0.25 }), u, { at: [2.78, 1.46, Z0 + 0.026], r: 0.004, ink: null });
    pick(u, [X0, 1.1, PZ - 0.22], [X0 + 0.15, 2.45, PZ + 0.22]);
    pick(u, [X0, 0, PZ - 0.1], [X0 + 0.15, 0.8, PZ + 0.2]);
    pick(u, [2.7, 1.38, Z0], [2.86, 1.52, Z0 + 0.05]);
  }
  // Outlet low, switch at hand height. The plates come off to show the box and wires.
  const OZ = 0.38;
  const lightSwitch: THREE.Group[] = [];
  {
    const o = outlets;
    const plates: THREE.Group[] = [];
    for (const [kind, y] of [['duplex', 0.32], ['switch', 1.2]] as const) {
      // Blue box behind the plate, and wires that stretch as the device pulls out.
      box(0.06, 0.1, 0.004, toon(C.boxBlue), o, { at: [X0 + 0.002, y, OZ], rot: [0, Math.PI / 2, 0], r: 0.002, ink: null });
      const wires = pivot(o, [X0 + 0.004, y, OZ]);
      wires.rotation.y = Math.PI / 2;
      for (const [col, dx, dy] of [[M.wire.black, 0.022, 0.03], [M.wire.white, -0.022, -0.03], [M.wire.bare, 0, -0.04]] as const) {
        tube([V(0, 0, 0), V(dx * 0.6, dy * 0.5, 0.02), V(dx, dy, 0.045)], 0.003, col, wires, { seg: 8, ink: null });
      }
      wires.scale.z = 0.01;
      wires.visible = false;
      const p = plateWith(o, kind, [X0, y, OZ], '+x');
      p.userData.wires = wires;
      plates.push(p);
      if (kind === 'switch') lightSwitch.push(p);
    }
    lidHooks.coverPlates = (k) => plates.forEach((p) => {
      const plate = p.children[0];
      plate.position.set(0, -0.17 * k, 0.004 + 0.1 * k);
      plate.rotation.x = 0.4 * k;
      (p.userData.device as THREE.Group).position.z = 0.008 + 0.045 * k;
      const wires = p.userData.wires as THREE.Group;
      wires.visible = k > 0.02;
      wires.scale.z = Math.max(0.01, k);
    });
    pick(o, [X0, 0.2, OZ - 0.08], [X0 + 0.12, 0.45, OZ + 0.08]);
    pick(o, [X0, 1.08, OZ - 0.08], [X0 + 0.12, 1.32, OZ + 0.08]);
  }
  // Doorknob hole in the drywall, with a patch kit on the floor below it.
  {
    const w = wallA;
    const HZ = 0.86;
    const HY = 0.92;
    const jag = (rad: number, seed: number) => {
      const rr = rng(seed);
      const sh = new THREE.Shape();
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const rad2 = rad * (0.75 + rr() * 0.45);
        i ? sh.lineTo(Math.cos(a) * rad2, Math.sin(a) * rad2 * 0.9) : sh.moveTo(Math.cos(a) * rad2, Math.sin(a) * rad2 * 0.9);
      }
      return new THREE.ShapeGeometry(sh);
    };
    add(jag(0.085, 3), toon(C.trim), w, { at: [X0 + 0.0015, HY, HZ], rot: [0, Math.PI / 2, 0] });
    add(jag(0.065, 4), toon(TONE.umber), w, { at: [X0 + 0.003, HY, HZ], rot: [0, Math.PI / 2, 0], ink: null });
    add(new THREE.CylinderGeometry(0.13, 0.12, 0.3, 20), M.plate, w, { at: [X0 + 0.25, 0.15, 0.56] });
    add(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 20), toon(C.boxBlue), w, { at: [X0 + 0.25, 0.315, 0.56] });
    box(0.32, 0.07, 0.11, toon(TONE.toolSteel, { shine: 0.6, metal: 0.5 }), w, { at: [X0 + 0.4, 0.036, 0.95], rot: [0, 0.4, 0], r: 0.008 });
    box(0.15, 0.004, 0.1, M.steel, w, { at: [X0 + 0.55, 0.004, 1.18], rot: [0, -0.3, 0], r: 0.002 });
    add(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 10), toon(C.boxBlue), w, { at: [X0 + 0.66, 0.016, 1.12], rot: [Math.PI / 2, 0, 1.27] });
    const mesh = canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#f2f0e8';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#c9c3b2';
      for (let i = 4; i < 64; i += 6) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
      }
    });
    box(0.16, 0.003, 0.16, textured(mesh), w, { at: [X0 + 0.3, 0.003, 1.22], rot: [0, 0.2, 0], r: 0.001 });
    box(0.1, 0.03, 0.07, toon(C.sponge), w, { at: [X0 + 0.18, 0.015, 1.02], rot: [0, -0.5, 0], r: 0.008 });
    pick(w, [X0, 0.75, HZ - 0.15], [X0 + 0.12, 1.1, HZ + 0.15]);
    pick(w, [X0, 0, 0.4], [X0 + 0.75, 0.35, 1.3]);
  }
  // Front door: prehung in the left wall, swings in.
  const doorHinge = pivot(doorA, [X0 - 0.015, 0, DOOR.z0 + 0.025]);
  const knobs: THREE.Object3D[] = [];
  {
    const d = doorA;
    const jamb = (min: V3, max: V3) => slab(min, max, M.trim, d, 'thin');
    jamb([X0 - T, DOOR.y1 - 0.025, DOOR.z0], [X0, DOOR.y1, DOOR.z1]);
    jamb([X0 - T, 0, DOOR.z0], [X0, DOOR.y1, DOOR.z0 + 0.022]);
    jamb([X0 - T, 0, DOOR.z1 - 0.022], [X0, DOOR.y1, DOOR.z1]);
    jamb([X0 - 0.09, 0, DOOR.z0 + 0.02], [X0 - 0.07, DOOR.y1 - 0.02, DOOR.z0 + 0.035]);
    jamb([X0 - 0.09, 0, DOOR.z1 - 0.035], [X0 - 0.07, DOOR.y1 - 0.02, DOOR.z1 - 0.02]);
    jamb([X0, 0, DOOR.z0 - 0.07], [X0 + 0.018, DOOR.y1 + 0.07, DOOR.z0]);
    jamb([X0, 0, DOOR.z1], [X0 + 0.018, DOOR.y1 + 0.07, DOOR.z1 + 0.07]);
    jamb([X0, DOOR.y1, DOOR.z0 - 0.07], [X0 + 0.018, DOOR.y1 + 0.07, DOOR.z1 + 0.07]);
    slab([X0 - T, 0, DOOR.z0], [X0, 0.022, DOOR.z1], M.steel, d, 'thin');
    slab([X0 - 0.07, 0.02, DOOR.z0 + 0.035], [X0 - 0.064, DOOR.y1 - 0.03, DOOR.z0 + 0.04], M.black, d, null);
    slab([X0 - 0.07, 0.02, DOOR.z1 - 0.04], [X0 - 0.064, DOOR.y1 - 0.03, DOOR.z1 - 0.035], M.black, d, null);
    // The slab, with six raised panels on the inside face.
    const W = DOOR.z1 - DOOR.z0 - 0.05;
    slab([-0.045, 0.024, 0], [0, 2.05, W], M.door, doorHinge, 'body');
    for (const [y0, y1] of [[1.56, 1.96], [0.98, 1.46], [0.16, 0.88]]) {
      for (const [z0, z1] of [[0.09, 0.39], [W - 0.39, W - 0.09]]) {
        box(0.012, y1 - y0, z1 - z0, M.door, doorHinge, { at: [0.004, (y0 + y1) / 2, (z0 + z1) / 2], r: 0.006 });
      }
    }
    for (const y of [0.25, 1.04, 1.84]) box(0.012, 0.09, 0.03, M.brass, doorHinge, { at: [-0.003, y, -0.004], r: 0.003 });
    for (const sx of [1, -1]) {
      const kx = sx > 0 ? 0.004 : -0.049;
      const knob = add(new THREE.SphereGeometry(0.03, 14, 10), M.brass, doorHinge, { at: [kx + sx * 0.045, 0.92, W - 0.07] });
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), M.brass, doorHinge, { at: [kx + sx * 0.008, 0.92, W - 0.07], rot: [0, 0, Math.PI / 2] });
      add(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8), M.brass, doorHinge, { at: [kx + sx * 0.025, 0.92, W - 0.07], rot: [0, 0, Math.PI / 2] });
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 16), M.brass, doorHinge, { at: [kx + sx * 0.008, 1.08, W - 0.07], rot: [0, 0, Math.PI / 2] });
      knobs.push(knob);
    }
    box(0.016, 0.04, 0.012, M.brass, doorHinge, { at: [0.02, 1.08, W - 0.07], r: 0.004 });
    lidHooks.frontDoor = (k) => (doorHinge.rotation.y = 1.45 * k);
    slab([X0 + 0.04, 0.002, DOOR.z0 + 0.05], [X0 + 0.62, 0.014, DOOR.z1 - 0.05], textured(speckle('#b08850', ['#8f6a3c', '#c9a46a'], 900, [1, 3], [2, 2], 31)), d, 'thin');
    slab([X0 - T - 0.5, -0.2, DOOR.z0 - 0.15], [X0 - T, -0.02, DOOR.z1 + 0.15], textured(speckle('#a7a39b', ['#8e8a82', '#bdb9b0'], 300, [1, 3], [2, 2], 12)), d);
    pick(d, [X0 - T, 0, DOOR.z0 - 0.08], [X0 + 0.1, DOOR.y1 + 0.08, DOOR.z1 + 0.08]);
  }
  return { PZ, tripped, OZ, lightSwitch, knobs };
}
