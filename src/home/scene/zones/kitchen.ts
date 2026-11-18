import * as THREE from 'three';
import { glass, toon } from '../../../shared/toon';
import { add, box, canvasTex, mapped, range, rng, speckle, tube, type V3 } from '../../../shared/scene/kit';
import { V, Z0, T, WIN } from '../room';
import { subway } from '../textures';
import type { HomeCtx } from '../ctx';

export function buildKitchen(c: HomeCtx) {
  const { lidHooks, M, area, pick, slab, pivot, shaker, plateWith, s } = c;
  const counters = area('counters');
  const sink = area('sink');
  const appliances = area('appliances');
  const win = area('window');
  const CAB_D = 0.58;
  const CT = s.counter === 'quartz' ? 0.03 : 0.038;
  const CTOP = 0.88 + CT;
  const SINK = { x0: -0.52, x1: 0.22, z0: Z0 + 0.12, z1: Z0 + 0.5, cx: -0.15 };

  // Base cabinet carcasses (sink base is open so the plumbing shows).
  const carcass = (x0: number, x1: number) => {
    slab([x0, 0.1, Z0], [x1, 0.88, Z0 + CAB_D], M.cab, counters, 'thin');
    slab([x0 + 0.01, 0, Z0], [x1 - 0.01, 0.1, Z0 + CAB_D - 0.06], M.black, counters, null);
  };
  carcass(-1.0, -0.6);
  shaker(counters, 0.39, 0.15, [-0.8, 0.79, Z0 + CAB_D + 0.01], M.cab, false, 'bar', 'top');
  shaker(counters, 0.39, 0.58, [-0.8, 0.41, Z0 + CAB_D + 0.01], M.cab, false, 'bar', 'side-r');
  carcass(0.9, 1.5);
  for (const [y, hh] of [[0.79, 0.15], [0.56, 0.27], [0.25, 0.3]] as const) shaker(counters, 0.59, hh, [1.2, y, Z0 + CAB_D + 0.01], M.cab, false, 'bar', 'top');
  // Sink base: sides, bottom, top rail and a dark inside.
  slab([-0.6, 0.1, Z0], [-0.58, 0.88, Z0 + CAB_D], M.cab, sink, 'thin');
  slab([0.28, 0.1, Z0], [0.3, 0.88, Z0 + CAB_D], M.cab, sink, 'thin');
  slab([-0.58, 0.1, Z0], [0.28, 0.12, Z0 + CAB_D], M.cabIn, sink, null);
  slab([-0.58, 0.12, Z0], [0.28, 0.84, Z0 + 0.01], M.cabIn, sink, null);
  slab([-0.6, 0.84, Z0 + CAB_D - 0.02], [0.3, 0.88, Z0 + CAB_D], M.cab, sink, 'thin');
  slab([-0.59, 0, Z0], [0.29, 0.1, Z0 + CAB_D - 0.06], M.black, sink, null);
  const sinkDoors: THREE.Group[] = [];
  for (const [hx, sd] of [[-0.6, 1], [0.3, -1]] as const) {
    const hinge = pivot(sink, [hx, 0.48, Z0 + CAB_D + 0.01]);
    shaker(hinge, 0.448, 0.71, [sd * 0.224, 0, 0], M.cab, false, 'bar', sd > 0 ? 'side' : 'side-r');
    hinge.userData.sd = sd;
    sinkDoors.push(hinge);
  }
  lidHooks.sinkDoors = (t) => sinkDoors.forEach((d) => (d.rotation.y = -d.userData.sd * 1.75 * t));

  // Countertop with the sink cut out, in the chosen material.
  const counterMat = {
    laminate: () => mapped(0xffffff, speckle('#cdc6b8', ['#a39b8d', '#e2dccf', '#8f877a', '#b8b0a2'], 1600, [1, 2], [2, 2], 21)),
    butcher: () => mapped(0xffffff, canvasTex(256, 64, (ctx) => {
      const rr = rng(4);
      for (let x = 0; x < 256; x += 8) {
        ctx.fillStyle = ['#c98f55', '#b97c45', '#d39d63', '#ad7240', '#c58a50'][Math.floor(rr() * 5)];
        ctx.fillRect(x, 0, 8, 64);
        ctx.fillStyle = 'rgba(90,50,20,0.25)';
        ctx.fillRect(x, 0, 1, 64);
      }
    }, [0.5, 2])),
    quartz: () => mapped(0xffffff, canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#f1efea';
      ctx.fillRect(0, 0, 256, 256);
      const rr = rng(8);
      ctx.strokeStyle = 'rgba(140,140,150,0.45)';
      for (let i = 0; i < 5; i++) {
        ctx.lineWidth = range(rr, 0.8, 2.2);
        ctx.beginPath();
        let x = rr() * 256;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < 256) {
          x += range(rr, -18, 18);
          y += range(rr, 14, 30);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }, [0.6, 0.6]), { shine: 0.5 }),
  }[s.counter]();
  {
    const sh = new THREE.Shape();
    const c = [[-1.0, Z0], [1.52, Z0], [1.52, Z0 + 0.635], [-1.0, Z0 + 0.635]];
    c.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
    const hole = new THREE.Path();
    hole.moveTo(SINK.x0, -SINK.z0); hole.lineTo(SINK.x0, -SINK.z1); hole.lineTo(SINK.x1, -SINK.z1); hole.lineTo(SINK.x1, -SINK.z0);
    sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: CT, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    add(g, counterMat, counters, [0, 0.88, 0], { ink: 'body' });
  }
  // Subway backsplash, one tile texture per patch so the tiles stay the same size.
  const splash = (x0: number, x1: number, y0: number, y1: number) => {
    slab([x0, y0, Z0], [x1, y1, Z0 + 0.008], mapped(0xffffff, subway([(x1 - x0) / 0.3, (y1 - y0) / 0.6])), counters, 'thin');
  };
  splash(-1.76, -1.0, 0.92, 1.58);
  splash(-1.0, 1.5, CTOP, 1.02);
  splash(-1.0, -0.72, 1.02, 1.6);
  splash(0.42, 1.5, 1.02, 1.45);
  plateWith(counters, 'gfci', [1.05, 1.2, Z0 + 0.008], '+z');
  slab([0.45, 1.45, Z0], [1.5, 2.2, Z0 + 0.33], M.cab, counters, 'thin');
  shaker(counters, 0.52, 0.74, [0.715, 1.825, Z0 + 0.34], M.cab, false, 'bar', 'side');
  shaker(counters, 0.52, 0.74, [1.235, 1.825, Z0 + 0.34], M.cab, false, 'bar', 'side-r');
  slab([1.56, 1.92, Z0], [2.46, 2.3, Z0 + 0.6], M.cab, counters, 'thin');
  shaker(counters, 0.448, 0.37, [1.786, 2.11, Z0 + 0.61], M.cab, false, 'bar', 'side');
  shaker(counters, 0.448, 0.37, [2.234, 2.11, Z0 + 0.61], M.cab, false, 'bar', 'side-r');

  // Sink basin, faucet and the plumbing underneath.
  {
    const st = M.steel;
    const y0 = 0.66;
    slab([SINK.x0, y0, SINK.z0], [SINK.x1, y0 + 0.015, SINK.z1], st, sink, null);
    slab([SINK.x0, y0, SINK.z0], [SINK.x0 + 0.012, 0.88, SINK.z1], st, sink, null);
    slab([SINK.x1 - 0.012, y0, SINK.z0], [SINK.x1, 0.88, SINK.z1], st, sink, null);
    slab([SINK.x0, y0, SINK.z0], [SINK.x1, 0.88, SINK.z0 + 0.012], st, sink, null);
    slab([SINK.x0, y0, SINK.z1 - 0.012], [SINK.x1, 0.88, SINK.z1], st, sink, null);
    add(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 20), M.black, sink, [SINK.cx, y0 + 0.016, (SINK.z0 + SINK.z1) / 2], { ink: 'thin' });
    // Faucet: a gooseneck with a side lever.
    const fz = Z0 + 0.06;
    add(new THREE.CylinderGeometry(0.03, 0.034, 0.04, 16), M.chrome, sink, [SINK.cx, CTOP + 0.02, fz]);
    tube([V(SINK.cx, CTOP + 0.03, fz), V(SINK.cx, CTOP + 0.3, fz), V(SINK.cx, CTOP + 0.38, fz + 0.1), V(SINK.cx, CTOP + 0.33, fz + 0.21), V(SINK.cx, CTOP + 0.24, fz + 0.235)], 0.014, M.chrome, sink, { seg: 30, radial: 10 });
    tube([V(SINK.cx + 0.03, CTOP + 0.06, fz), V(SINK.cx + 0.09, CTOP + 0.09, fz + 0.02)], 0.008, M.chrome, sink);
  }
  const DRIP_FROM = V(SINK.cx, CTOP + 0.225, Z0 + 0.295);
  {
    const cz = (SINK.z0 + SINK.z1) / 2;
    add(new THREE.CylinderGeometry(0.05, 0.04, 0.05, 16), M.steel, sink, [SINK.cx, 0.635, cz]);
    const disp = add(new THREE.CylinderGeometry(0.095, 0.1, 0.27, 20), toon(0x2b2f3a, { shine: 0.4 }), sink, [SINK.cx, 0.47, cz]);
    disp.userData.label = 'disposal';
    add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20), M.steel, sink, [SINK.cx, 0.59, cz]);
    // Disposal outlet elbow into the P-trap, then the trap arm to the wall.
    tube([V(SINK.cx + 0.09, 0.44, cz), V(SINK.cx + 0.2, 0.43, cz), V(SINK.cx + 0.24, 0.32, cz - 0.02), V(SINK.cx + 0.24, 0.25, cz - 0.07), V(SINK.cx + 0.24, 0.31, cz - 0.13), V(SINK.cx + 0.24, 0.36, cz - 0.2), V(SINK.cx + 0.24, 0.37, Z0 + 0.01)], 0.021, M.pvc, sink, { seg: 40, radial: 10 });
    add(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12), M.pvc, sink, [SINK.cx + 0.24, 0.37, Z0 + 0.02], { rot: [Math.PI / 2, 0, 0] });
    // Shut-off valves with braided supply lines up to the faucet.
    for (const [vx, col] of [[-0.42, 0xd8432f], [0.12, 0x3b82f6]] as const) {
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 10), M.chrome, sink, [vx, 0.3, Z0 + 0.03], { rot: [Math.PI / 2, 0, 0] });
      add(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 10), M.chrome, sink, [vx, 0.3, Z0 + 0.065]);
      box(0.045, 0.012, 0.02, toon(col), sink, [vx, 0.3, Z0 + 0.09], { r: 0.005 });
      tube([V(vx, 0.32, Z0 + 0.065), V(vx, 0.5, Z0 + 0.07), V(SINK.cx + (vx < 0 ? -0.02 : 0.02), 0.75, Z0 + 0.065), V(SINK.cx + (vx < 0 ? -0.01 : 0.01), 0.86, Z0 + 0.06)], 0.007, M.braided, sink, { seg: 24 });
    }
    // Dishwasher drain hose, looped high before it drops into the disposal.
    tube([V(0.29, 0.15, Z0 + 0.2), V(0.2, 0.5, Z0 + 0.15), V(0.05, 0.8, Z0 + 0.12), V(-0.05, 0.7, cz - 0.06), V(SINK.cx + 0.08, 0.53, cz)], 0.01, toon(0x8e939c), sink, { seg: 30 });
  }

  // Window over the sink: double-hung, the lower sash slides up.
  {
    const w = win;
    const jamb = (min: V3, max: V3) => slab(min, max, M.trim, w, 'thin');
    jamb([WIN.x0, WIN.y0, Z0 - T], [WIN.x1, WIN.y0 + 0.02, Z0]);
    jamb([WIN.x0, WIN.y1 - 0.02, Z0 - T], [WIN.x1, WIN.y1, Z0]);
    jamb([WIN.x0, WIN.y0, Z0 - T], [WIN.x0 + 0.02, WIN.y1, Z0]);
    jamb([WIN.x1 - 0.02, WIN.y0, Z0 - T], [WIN.x1, WIN.y1, Z0]);
    jamb([WIN.x0 - 0.07, WIN.y0 - 0.02, Z0], [WIN.x0, WIN.y1 + 0.07, Z0 + 0.018]);
    jamb([WIN.x1, WIN.y0 - 0.02, Z0], [WIN.x1 + 0.07, WIN.y1 + 0.07, Z0 + 0.018]);
    jamb([WIN.x0 - 0.07, WIN.y1, Z0], [WIN.x1 + 0.07, WIN.y1 + 0.07, Z0 + 0.018]);
    jamb([WIN.x0 - 0.1, WIN.y0 - 0.025, Z0 - 0.03], [WIN.x1 + 0.1, WIN.y0, Z0 + 0.06]);
    jamb([WIN.x0 - 0.05, 1.02, Z0], [WIN.x1 + 0.05, WIN.y0 - 0.025, Z0 + 0.015]);
    slab([WIN.x0 - 0.06, WIN.y0 - 0.04, Z0 - T - 0.06], [WIN.x1 + 0.06, WIN.y0, Z0 - T], M.trim, w, 'thin');
    const pane = glass({ tint: 0x22355a, streak: 0xcfe6ff, alpha: 0.32, streaks: 0.8 });
    const sash = (y0: number, z: number) => {
      const g = new THREE.Group();
      g.position.set((WIN.x0 + WIN.x1) / 2, y0, z);
      w.add(g);
      const sw = WIN.x1 - WIN.x0 - 0.04;
      const sh = (WIN.y1 - WIN.y0) / 2 + 0.01;
      slab([-sw / 2, 0, -0.02], [-sw / 2 + 0.05, sh, 0.02], M.trim, g, 'thin');
      slab([sw / 2 - 0.05, 0, -0.02], [sw / 2, sh, 0.02], M.trim, g, 'thin');
      slab([-sw / 2, 0, -0.02], [sw / 2, 0.06, 0.02], M.trim, g, 'thin');
      slab([-sw / 2, sh - 0.05, -0.02], [sw / 2, sh, 0.02], M.trim, g, 'thin');
      const glassM = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.1, sh - 0.11), pane);
      glassM.position.set(0, 0.06 + (sh - 0.11) / 2, 0);
      glassM.renderOrder = 2;
      g.add(glassM);
      return g;
    };
    sash(WIN.y0 + (WIN.y1 - WIN.y0) / 2 - 0.01, Z0 - 0.095);
    const lower = sash(WIN.y0 + 0.02, Z0 - 0.045);
    box(0.06, 0.015, 0.03, M.brass, lower, [0, (WIN.y1 - WIN.y0) / 2 + 0.01, 0.015], { r: 0.005, ink: 'thin' });
    lidHooks.sash = (t) => (lower.position.y = WIN.y0 + 0.02 + 0.4 * t);
  }

  {
    const a = appliances;
    const x0 = -1.76;
    const x1 = -1.0;
    const cx = (x0 + x1) / 2;
    box(x1 - x0, 0.9, 0.64, M.steel, a, [cx, 0.45, Z0 + 0.34], { r: 0.012 });
    box(x1 - x0 + 0.004, 0.016, 0.62, M.black, a, [cx, 0.905, Z0 + 0.33], { r: 0.004 });
    box(x1 - x0, 0.1, 0.06, M.steel, a, [cx, 0.96, Z0 + 0.04], { r: 0.01 });
    // Oven door with a window, bar handle, knobs and a storage drawer.
    box(0.72, 0.52, 0.025, M.steel, a, [cx, 0.44, Z0 + 0.67], { r: 0.008 });
    box(0.5, 0.24, 0.01, toon(0x15171c, { shine: 0.6 }), a, [cx, 0.44, Z0 + 0.684], { r: 0.008, ink: 'thin' });
    tube([V(x0 + 0.06, 0.72, Z0 + 0.68), V(x0 + 0.06, 0.72, Z0 + 0.72), V(x1 - 0.06, 0.72, Z0 + 0.72), V(x1 - 0.06, 0.72, Z0 + 0.68)], 0.011, M.chrome, a, { seg: 20 });
    box(0.72, 0.12, 0.02, M.steel, a, [cx, 0.1, Z0 + 0.665], { r: 0.006 });
    for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 14), M.black, a, [x0 + 0.13 + i * 0.165, 0.83, Z0 + 0.665], { rot: [Math.PI / 2, 0, 0] });
    const burners: THREE.Mesh[] = [];
    for (const [bx, bz, rr] of [[-0.18, 0.18, 0.09], [0.18, 0.18, 0.07], [-0.18, 0.46, 0.07], [0.18, 0.46, 0.09]] as const) {
      const ring = add(new THREE.TorusGeometry(rr, 0.006, 6, 28), toon(0x4a2a26), a, [cx + bx, 0.915, Z0 + bz], { rot: [Math.PI / 2, 0, 0], ink: null });
      burners.push(ring);
    }
    a.userData.burners = burners;
    const hood = new THREE.CylinderGeometry(0.34, 1, 0.16, 4, 1);
    hood.rotateY(Math.PI / 4);
    add(hood, M.steel, a, [cx, 1.68, Z0 + 0.26], { scale: [0.537, 1, 0.354] });
    box(0.78, 0.03, 0.52, M.steel, a, [cx, 1.585, Z0 + 0.26], { r: 0.006 });
    box(0.26, 0.86, 0.2, M.steel, a, [cx, 2.17, Z0 + 0.12], { r: 0.006 });
  }
  {
    const a = appliances;
    box(0.59, 0.76, 0.025, M.steel, a, [0.6, 0.48, Z0 + 0.585], { r: 0.008 });
    box(0.59, 0.06, 0.03, toon(0x2b2f36, { shine: 0.4 }), a, [0.6, 0.84, Z0 + 0.58], { r: 0.006, ink: 'thin' });
    tube([V(0.36, 0.77, Z0 + 0.6), V(0.36, 0.77, Z0 + 0.635), V(0.84, 0.77, Z0 + 0.635), V(0.84, 0.77, Z0 + 0.6)], 0.009, M.chrome, a, { seg: 16 });
    slab([0.31, 0, Z0], [0.89, 0.1, Z0 + 0.53], M.black, a, null);
  }
  // Fridge: French doors over a freezer drawer.
  {
    const a = appliances;
    const x0 = 1.56;
    const x1 = 2.46;
    box(x1 - x0, 1.78, 0.72, M.steel, a, [(x0 + x1) / 2, 0.89, Z0 + 0.38], { r: 0.02 });
    for (const sd of [-1, 1]) {
      const cx = (x0 + x1) / 2 + sd * 0.224;
      box(0.444, 1.0, 0.05, M.steel, a, [cx, 1.26, Z0 + 0.765], { r: 0.012 });
      tube([V(cx - sd * 0.19, 0.9, Z0 + 0.79), V(cx - sd * 0.19, 0.9, Z0 + 0.83), V(cx - sd * 0.19, 1.5, Z0 + 0.83), V(cx - sd * 0.19, 1.5, Z0 + 0.79)], 0.011, M.chrome, a, { seg: 16 });
    }
    box(0.15, 0.24, 0.01, toon(0x24272e, { shine: 0.5 }), a, [(x0 + x1) / 2 - 0.26, 1.3, Z0 + 0.792], { r: 0.012, ink: 'thin' });
    box(0.89, 0.68, 0.05, M.steel, a, [(x0 + x1) / 2, 0.38, Z0 + 0.765], { r: 0.012 });
    tube([V(x0 + 0.15, 0.66, Z0 + 0.79), V(x0 + 0.15, 0.66, Z0 + 0.83), V(x1 - 0.15, 0.66, Z0 + 0.83), V(x1 - 0.15, 0.66, Z0 + 0.79)], 0.011, M.chrome, a, { seg: 16 });
  }
  pick(counters, [-1.0, 0, Z0], [1.52, 1.0, Z0 + 0.66]);
  pick(counters, [0.45, 1.45, Z0], [2.46, 2.3, Z0 + 0.35]);
  pick(sink, [SINK.x0 - 0.05, 0.7, Z0], [SINK.x1 + 0.05, 1.3, SINK.z1]);
  pick(win, [WIN.x0 - 0.1, WIN.y0, Z0 - 0.05], [WIN.x1 + 0.1, WIN.y1 + 0.08, Z0 + 0.08]);
  pick(appliances, [-1.76, 0, Z0], [-1.0, 1.02, Z0 + 0.7]);
  pick(appliances, [-1.76, 1.55, Z0], [-1.0, 2.6, Z0 + 0.52]);
  pick(appliances, [0.3, 0, Z0], [0.9, 0.86, Z0 + 0.62]);
  pick(appliances, [1.56, 0, Z0], [2.46, 1.8, Z0 + 0.84]);
  return { sink, appliances, SINK, DRIP_FROM };
}
