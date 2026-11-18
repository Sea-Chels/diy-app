import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, box, mapped, range, tube, V } from '../../../shared/scene/kit';
import { X0, Z0, PH, BX } from '../room';
import { subway } from '../textures';
import type { HomeCtx } from '../ctx';

export function buildBathroom(c: HomeCtx) {
  const { r, lidHooks, M, area, pick, slab, pivot, shaker } = c;
  const bath = area('bath');
  const toilet = area('toilet');
  // Alcove tub across the back of the bathroom.
  {
    const b = bath;
    const TD = 0.76;
    slab([X0, 0, Z0 + TD - 0.08], [BX, 0.5, Z0 + TD], M.porcelain, b);
    slab([X0, 0, Z0], [BX, 0.5, Z0 + 0.08], M.porcelain, b);
    slab([X0, 0, Z0], [X0 + 0.1, 0.5, Z0 + TD], M.porcelain, b);
    slab([BX - 0.1, 0, Z0], [BX, 0.5, Z0 + TD], M.porcelain, b);
    slab([X0 + 0.1, 0, Z0 + 0.08], [BX - 0.1, 0.1, Z0 + TD - 0.08], toon(0xeef3f4, { shine: 0.5 }), b, null);
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 16), M.chrome, b, { at: [X0 + 0.3, 0.103, Z0 + TD / 2] });
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 16), M.chrome, b, { at: [X0 + 0.104, 0.36, Z0 + TD / 2], rot: [0, 0, Math.PI / 2] });
    // Tile surround on three sides.
    const tileM = (w: number, h: number) => mapped(0xffffff, subway([w / 0.3, h / 0.6], '#ffffff', '#b9c4c6'));
    slab([X0, 0.5, Z0], [BX, 1.85, Z0 + 0.008], tileM(BX - X0, 1.35), b, 'thin');
    slab([X0, 0.5, Z0], [X0 + 0.008, 1.85, Z0 + TD], tileM(TD, 1.35), b, 'thin');
    slab([BX - 0.008, 0.5, Z0], [BX, PH, Z0 + TD], tileM(TD, PH - 0.5), b, 'thin');
    // Spout, valve and showerhead on the end wall.
    const zc = Z0 + TD / 2;
    tube([V(X0 + 0.008, 0.66, zc), V(X0 + 0.1, 0.66, zc), V(X0 + 0.14, 0.62, zc)], 0.018, M.chrome, b, { seg: 12, radial: 10 });
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24), M.chrome, b, { at: [X0 + 0.014, 1.0, zc], rot: [0, 0, Math.PI / 2] });
    tube([V(X0 + 0.02, 1.0, zc), V(X0 + 0.07, 1.0, zc), V(X0 + 0.08, 1.0, zc + 0.08)], 0.01, M.chrome, b, { seg: 8 });
    tube([V(X0 + 0.008, 1.85, zc), V(X0 + 0.14, 1.88, zc), V(X0 + 0.2, 1.84, zc)], 0.011, M.chrome, b, { seg: 12 });
    add(new THREE.CylinderGeometry(0.07, 0.04, 0.05, 20), M.chrome, b, { at: [X0 + 0.22, 1.82, zc], rot: [0, 0, 0.5] });
    // The caulk bead where the tub meets the tile, going moldy in spots.
    tube([V(X0, 0.505, Z0 + 0.012), V(BX, 0.505, Z0 + 0.012)], 0.007, M.porcelain, b, { seg: 4, ink: null });
    tube([V(X0 + 0.012, 0.505, Z0), V(X0 + 0.012, 0.505, Z0 + TD)], 0.007, M.porcelain, b, { seg: 4, ink: null });
    const mold = toon(0x4a4f3a);
    for (let i = 0; i < 9; i++) add(new THREE.SphereGeometry(0.008, 6, 4), mold, b, { at: [range(r, X0 + 0.1, BX - 0.1), 0.508, Z0 + 0.016], ink: null });
    pick(b, [X0, 0, Z0], [BX, 1.9, Z0 + TD]);
  }
  // Toilet on the left wall, facing into the room. The tank is hollow so the lid can lift.
  const TZ = -1.45;
  const tankWater: THREE.Mesh[] = [];
  const flapper = new THREE.Group();
  const handleArm = new THREE.Group();
  {
    const t = toilet;
    const tx0 = X0 + 0.02;
    const tx1 = X0 + 0.23;
    const tz0 = TZ - 0.24;
    const tz1 = TZ + 0.24;
    const wall = 0.016;
    slab([tx0, 0.4, tz0], [tx1, 0.42, tz1], M.porcelain, t, null);
    slab([tx0, 0.4, tz0], [tx0 + wall, 0.78, tz1], M.porcelain, t, 'thin');
    slab([tx1 - wall, 0.4, tz0], [tx1, 0.78, tz1], M.porcelain, t, 'thin');
    slab([tx0, 0.4, tz0], [tx1, 0.78, tz0 + wall], M.porcelain, t, 'thin');
    slab([tx0, 0.4, tz1 - wall], [tx1, 0.78, tz1], M.porcelain, t, 'thin');
    const water = slab([tx0 + wall, 0.42, tz0 + wall], [tx1 - wall, 0.68, tz1 - wall], M.water, t, null);
    water.castShadow = false;
    water.userData.top = 0.68;
    tankWater.push(water);
    // Flush valve with its overflow tube and the flapper at the bottom.
    const fx = (tx0 + tx1) / 2 + 0.01;
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16), toon(0xdcdcd4), t, { at: [fx, 0.43, TZ - 0.02] });
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 10), toon(0xdcdcd4), t, { at: [fx - 0.05, 0.54, TZ - 0.02] });
    flapper.position.set(fx - 0.04, 0.445, TZ - 0.02);
    t.add(flapper);
    add(new THREE.CylinderGeometry(0.04, 0.036, 0.016, 18), M.red, flapper, { at: [0.04, 0, 0] });
    // Handle and the lever arm inside, with the chain down to the flapper.
    const hz = TZ - 0.19;
    box(0.02, 0.025, 0.05, M.chrome, t, { at: [tx1 + 0.012, 0.72, hz], r: 0.008 });
    handleArm.position.set(tx1 - 0.02, 0.72, hz);
    t.add(handleArm);
    slab([-0.005, -0.004, 0], [0.005, 0.004, 0.16], M.chrome, handleArm, 'thin');
    tube([V(fx + 0.02, 0.455, TZ - 0.02), V(fx + 0.0, 0.6, TZ - 0.03), V(tx1 - 0.02, 0.715, hz + 0.15)], 0.0025, M.chrome, t, { seg: 12, ink: null });
    // Fill valve with a float cup and the refill tube into the overflow.
    const vz = TZ + 0.14;
    add(new THREE.CylinderGeometry(0.016, 0.02, 0.27, 12), toon(0x7d8590), t, { at: [fx - 0.02, 0.555, vz] });
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 14), toon(0x2c2f36), t, { at: [fx - 0.02, 0.6, vz] });
    add(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), toon(0x7d8590), t, { at: [fx - 0.02, 0.7, vz] });
    tube([V(fx - 0.02, 0.71, vz - 0.02), V(fx - 0.04, 0.74, TZ + 0.06), V(fx - 0.05, 0.68, TZ - 0.02)], 0.004, M.black, t, { seg: 14, ink: null });
    // Lid, lifted when the toilet is open.
    const lid = box(tx1 - tx0 + 0.02, 0.026, tz1 - tz0 + 0.02, M.porcelain, t, { at: [(tx0 + tx1) / 2, 0.793, TZ], r: 0.008 });
    // Bowl: a lathed shape stretched front to back.
    const prof = [[0.1, 0], [0.115, 0.04], [0.1, 0.14], [0.15, 0.27], [0.19, 0.37], [0.19, 0.4], [0.155, 0.4], [0.14, 0.36], [0.06, 0.25], [0, 0.24]].map(([a, b]) => new THREE.Vector2(a, b));
    const bowl = add(new THREE.LatheGeometry(prof, 28), M.porcelain, t, { at: [X0 + 0.47, 0, TZ], scale: [1.3, 1, 1] });
    bowl.userData.bowl = true;
    add(new THREE.CircleGeometry(0.1, 20), M.water, t, { at: [X0 + 0.48, 0.3, TZ], rot: [-Math.PI / 2, 0, 0], scale: [1.3, 1, 1], ink: null });
    add(new THREE.TorusGeometry(0.155, 0.024, 8, 28), M.porcelain, t, { at: [X0 + 0.47, 0.41, TZ], rot: [Math.PI / 2, 0, 0], scale: [1.3, 1, 0.45] });
    const seatLid = add(new THREE.CylinderGeometry(1, 1, 0.022, 28), M.porcelain, t, { at: [X0 + 0.27, 0.6, TZ], rot: [0, 0, Math.PI / 2 + 0.14], scale: [0.2, 1, 0.17] });
    seatLid.castShadow = true;
    lidHooks.tankLid = (k) => {
      // Lifted off in an arc and set on the floor in front of the bowl.
      lid.position.set((tx0 + tx1) / 2 + (X0 + 0.85 - (tx0 + tx1) / 2) * k, 0.793 * (1 - k) + 0.015 * k + 0.3 * Math.sin(Math.PI * k), TZ);
      // Seat lid swings shut so it doesn't hide the tank.
      const a = (Math.PI / 2 + 0.14) * (1 - k);
      seatLid.rotation.z = a;
      seatLid.position.set(X0 + 0.47 - 0.2 * Math.sin(a), 0.435 + 0.165 * Math.sin(a) * 1.0, TZ);
    };
    slab([X0 + 0.2, 0.03, TZ - 0.12], [X0 + 0.25, 0.4, TZ + 0.12], M.porcelain, t, 'thin');
    for (const sd of [-1, 1]) add(new THREE.SphereGeometry(0.018, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.porcelain, t, { at: [X0 + 0.5, 0.02, TZ + sd * 0.12] });
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 10), M.chrome, t, { at: [X0 + 0.025, 0.17, TZ + 0.14], rot: [0, 0, Math.PI / 2] });
    box(0.02, 0.012, 0.045, toon(0xd8d8d8, { shine: 0.6 }), t, { at: [X0 + 0.06, 0.17, TZ + 0.14], r: 0.005 });
    tube([V(X0 + 0.05, 0.18, TZ + 0.14), V(X0 + 0.09, 0.28, TZ + 0.15), V(fx - 0.02, 0.39, vz)], 0.006, M.braided, t, { seg: 14 });
    pick(t, [X0, 0, TZ - 0.27], [X0 + 0.7, 0.9, TZ + 0.27]);
  }
  // Vanity on the left wall with a mirror above. Doors open on the trap and supply valves.
  {
    const b = bath;
    const z0 = -1.07;
    const z1 = -0.52;
    const zc = (z0 + z1) / 2;
    const d = 0.52;
    slab([X0, 0.1, z0], [X0 + d, 0.82, z0 + 0.02], M.cab, b, 'thin');
    slab([X0, 0.1, z1 - 0.02], [X0 + d, 0.82, z1], M.cab, b, 'thin');
    slab([X0, 0.1, z0], [X0 + d, 0.12, z1], M.cabIn, b, null);
    slab([X0, 0.12, z0], [X0 + 0.01, 0.82, z1], M.cabIn, b, null);
    slab([X0 + d - 0.02, 0.78, z0], [X0 + d, 0.82, z1], M.cab, b, 'thin');
    slab([X0, 0, z0 + 0.01], [X0 + d - 0.06, 0.1, z1 - 0.01], M.black, b, null);
    const sh = new THREE.Shape();
    [[X0, z0 - 0.02], [X0 + d + 0.025, z0 - 0.02], [X0 + d + 0.025, z1 + 0.02], [X0, z1 + 0.02]].forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
    const hole = new THREE.Path();
    hole.absellipse(X0 + 0.3, -zc, 0.15, 0.12, 0, Math.PI * 2, true, 0);
    sh.holes.push(hole);
    const top = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false, curveSegments: 24 });
    top.rotateX(-Math.PI / 2);
    add(top, M.porcelain, b, { at: [0, 0.82, 0] });
    add(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.porcelain, b, { at: [X0 + 0.3, 0.852, zc], scale: [0.152, 0.1, 0.122] });
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 12), M.chrome, b, { at: [X0 + 0.3, 0.755, zc], ink: null });
    tube([V(X0 + 0.05, 0.855, zc), V(X0 + 0.06, 0.95, zc), V(X0 + 0.14, 0.95, zc), V(X0 + 0.16, 0.92, zc)], 0.012, M.chrome, b, { seg: 16, radial: 10 });
    for (const sd of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.016, 0.02, 0.04, 12), M.chrome, b, { at: [X0 + 0.06, 0.875, zc + sd * 0.1] });
      box(0.012, 0.012, 0.05, M.chrome, b, { at: [X0 + 0.06, 0.9, zc + sd * 0.1], r: 0.005 });
    }
    add(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6), M.chrome, b, { at: [X0 + 0.03, 0.88, zc] });
    // Tailpiece, pop-up pivot rod and P-trap into the wall.
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10), M.chrome, b, { at: [X0 + 0.3, 0.64, zc] });
    add(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), M.chrome, b, { at: [X0 + 0.24, 0.68, zc], rot: [0, 0, Math.PI / 2] });
    tube([V(X0 + 0.3, 0.54, zc), V(X0 + 0.3, 0.44, zc), V(X0 + 0.25, 0.4, zc), V(X0 + 0.2, 0.45, zc), V(X0 + 0.12, 0.48, zc), V(X0 + 0.01, 0.48, zc)], 0.018, M.chrome, b, { seg: 30, radial: 10 });
    for (const sd of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 10), M.chrome, b, { at: [X0 + 0.035, 0.3, zc + sd * 0.15], rot: [0, 0, Math.PI / 2] });
      box(0.02, 0.012, 0.04, sd < 0 ? M.red : M.coldBlue, b, { at: [X0 + 0.07, 0.3, zc + sd * 0.15], r: 0.005 });
      tube([V(X0 + 0.06, 0.31, zc + sd * 0.15), V(X0 + 0.07, 0.6, zc + sd * 0.12), V(X0 + 0.06, 0.82, zc + sd * 0.1)], 0.005, M.braided, b, { seg: 14 });
    }
    const doors: THREE.Group[] = [];
    for (const [hz, sd] of [[z0 + 0.02, 1], [z1 - 0.02, -1]] as const) {
      const hinge = pivot(b, [X0 + d + 0.01, 0.45, hz]);
      shaker(hinge, 0.248, 0.64, [0, 0, sd * 0.124], M.cab, true, 'knob');
      hinge.userData.sd = sd;
      doors.push(hinge);
    }
    lidHooks.vanityDoors = (k) => doors.forEach((g) => (g.rotation.y = g.userData.sd * 1.7 * k));
    slab([X0, 1.02, z0 + 0.02], [X0 + 0.03, 1.66, z1 - 0.02], M.walnut, b, 'thin');
    slab([X0 + 0.03, 1.05, z0 + 0.05], [X0 + 0.034, 1.63, z1 - 0.05], toon(0xcfe3ee, { shine: 1 }), b, null);
    pick(b, [X0, 0, z0 - 0.03], [X0 + 0.58, 1.7, z1 + 0.03]);
  }
  return { TZ, tankWater, flapper, handleArm };
}
