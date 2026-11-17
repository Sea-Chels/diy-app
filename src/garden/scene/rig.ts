/**
 * The comic garden: galvanized and cedar raised beds on gravel, a Three
 * Sisters patch, compost bays, a hydroponic rack, a herb spiral, a fruit
 * corner, a shed pantry, a rain barrel, a potting bench, an arbor and a tool
 * fence. Modelled in metres and scaled down; the contract with the scene is
 * `Rig`. Every AreaId in data/areas.ts gets a pick proxy, a beacon and a view.
 */
import * as THREE from 'three';
import type { AreaId, LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { tween, easeInOutCubic, lerp } from '../../shared/tween';
import { disposeTree, inkLine, shared, toon } from '../../shared/toon';
import { Batches, WIND, add, box, canvasTex, jitter, label, leafMatrix, mapped, range, rng, speckle, tube, woodTexture, type V3 } from './kit';
import * as P from './plants';

export interface View {
  pos: V3;
  target: V3;
}

export interface Rig {
  key: string;
  group: THREE.Group;
  /** Invisible boxes the pointer is tested against. */
  picks: THREE.Mesh[];
  /** Meshes whose ink lines light up when an area is hovered or selected. */
  glow: Map<AreaId, THREE.Mesh[]>;
  beacons: Map<AreaId, THREE.Mesh>;
  views: Record<AreaId, View>;
  overview: View;
  setLid(lid: LidId, open: boolean): void;
  poke(area: AreaId): void;
  update(t: number): void;
  dispose(): void;
}

export const rigKey = (s: Setup) => `${s.season}|${s.fill}|${s.hydro}`;

/** Metres to scene units. */
export const K = 0.6;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// ---------- shared geometry ----------

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
const LOW_SPHERE = new THREE.SphereGeometry(1, 14, 10);

/** Corrugated sheet `len` long and `h` tall, ribs running up, facing +z. */
const corrCache = new Map<string, THREE.BufferGeometry>();
function corrugated(len: number, h: number): THREE.BufferGeometry {
  const key = `${len}|${h}`;
  const hit = corrCache.get(key);
  if (hit) return hit;
  const amp = 0.011;
  const period = 0.076;
  const t = 0.004;
  const n = Math.ceil(len / period) * 8;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    pts.push(new THREE.Vector2(x, amp * Math.sin((x / period) * Math.PI * 2)));
  }
  for (let i = n; i >= 0; i--) {
    const x = -len / 2 + (len * i) / n;
    pts.push(new THREE.Vector2(x, amp * Math.sin((x / period) * Math.PI * 2) - t));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  corrCache.set(key, g);
  return g;
}

/** Canning jar, base at y=0, 0.14 m tall. */
const JAR = (() => {
  const pts = [V(0, 0), V(0.04, 0), V(0.046, 0.01), V(0.046, 0.1), V(0.036, 0.118), V(0.034, 0.13), V(0, 0.13)].map((v) => new THREE.Vector2(v.x, v.y));
  return new THREE.LatheGeometry(pts, 14);
})();

// ---------- the rig ----------

export function buildRig(s: Setup): Rig {
  const season = s.season;
  const r = rng(20240611);
  const b = new Batches();
  const k = P.plantKit(b, season, r);
  // Filled in while building, used by setLid / update.
  const lidHooks: Partial<Record<LidId, (k: number) => void>> = {};
  const steam: THREE.Mesh[] = [];
  const steamBase = new THREE.Vector3();
  const toolSwing: THREE.Group[] = [];
  const spigot = new THREE.Vector3();

  const root = new THREE.Group();
  root.scale.setScalar(K);

  // Materials. White ones are tinted per instance.
  const white = toon(0xffffff);
  const whiteShiny = toon(0xffffff, { shine: 0.7 });
  const M = {
    galv: toon(0xb4bcc6, { shine: 0.75, metal: 0.65 }),
    galvDark: toon(0x6d7480, { shine: 0.5, metal: 0.5 }),
    cedar: mapped(0xffffff, woodTexture('#c27a4c', '#8a4628', [1, 1])),
    cedarDark: mapped(0xffffff, woodTexture('#9a5a36', '#6a3a20', [1, 1])),
    weathered: mapped(0xffffff, woodTexture('#a89a86', '#7a6a58', [1, 1])),
    shedWall: mapped(0xffffff, woodTexture('#7f9fae', '#5f7f8e', [1, 3])),
    trim: toon(0xf1ece0),
    roof: mapped(0xffffff, canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = '#5d6470';
      ctx.fillRect(0, 0, 128, 128);
      for (let row = 0; row < 8; row++) {
        ctx.fillStyle = '#4a505b';
        ctx.fillRect(0, row * 16 + 13, 128, 3);
        for (let c = 0; c < 6; c++) ctx.fillRect(((c + (row % 2) * 0.5) * 128) / 6, row * 16, 2, 14);
      }
    }, [3, 2])),
    soil: mapped(0xffffff, speckle('#4a3222', ['#3a2618', '#5d4030', '#2c1c12', '#6a4a35'], 900, [2, 5], [3, 2], 4)),
    gravel: mapped(0xffffff, speckle('#b9ad9b', ['#8f8576', '#d8cfc0', '#a39684', '#7d7366', '#e6ddd0'], 2600, [2, 5], [10, 8], 9), { halftone: 0.8 }),
    stone: mapped(0xffffff, speckle('#a7a39b', ['#8e8a82', '#bdb9b0', '#7b776f'], 300, [1, 3], [1, 1], 12)),
    brick: mapped(0xffffff, canvasTex(128, 64, (ctx) => {
      ctx.fillStyle = '#d8cbb8';
      ctx.fillRect(0, 0, 128, 64);
      for (let row = 0; row < 4; row++) {
        for (let c = -1; c < 4; c++) {
          ctx.fillStyle = ['#a8492f', '#b9573a', '#94402a'][(row + c + 3) % 3];
          ctx.fillRect(c * 40 + (row % 2) * 20 + 2, row * 16 + 2, 36, 12);
        }
      }
    }, [2, 1])),
    pvc: toon(0xf2f2ee, { shine: 0.45 }),
    hose: toon(0x3f9a4a, { shine: 0.4 }),
    drip: toon(0x1f2226, { shine: 0.3 }),
    terracotta: toon(0xc8643a),
    tote: toon(0x2f4f7a, { shine: 0.3 }),
    water: new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.55 }),
    cloth: new THREE.MeshToonMaterial({ color: 0xf6f6f2, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }),
    steel: toon(0x9aa3b2, { shine: 0.7, metal: 0.7 }),
    handle: toon(0xc9a06a),
    blade: toon(0x8c95a3, { shine: 0.8, metal: 0.8 }),
    red: toon(0xd8432f),
    barrel: toon(0x3e6b52, { shine: 0.35 }),
    brass: toon(0xd8b04a, { shine: 0.8, metal: 0.6 }),
    cardboard: mapped(0xffffff, canvasTex(64, 16, (ctx) => {
      ctx.fillStyle = '#c69c64';
      ctx.fillRect(0, 0, 64, 16);
      ctx.strokeStyle = '#8f6a3c';
      for (let x = 0; x < 64; x += 4) {
        ctx.beginPath();
        ctx.arc(x + 2, 8, 2, 0, Math.PI);
        ctx.stroke();
      }
    }, [8, 1])),
  };

  // ---------- area bookkeeping ----------
  const areas = new Map<AreaId, THREE.Group>();
  const picks: THREE.Mesh[] = [];
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  function area(id: AreaId, x: number, z: number, rotY = 0): THREE.Group {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    g.userData.batchRoot = true;
    g.userData.area = id;
    root.add(g);
    g.updateWorldMatrix(true, false);
    areas.set(id, g);
    return g;
  }
  function pick(g: THREE.Group, w: number, h: number, d: number, p: V3): void {
    const m = new THREE.Mesh(UNIT_BOX, pickMat);
    m.scale.set(w, h, d);
    m.position.set(...p);
    m.userData.area = g.userData.area;
    g.add(m);
    picks.push(m);
  }
  /** Instance a unit geometry (box, cylinder) with a matrix built from position, rotation and size. */
  function inst(g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: V3, size: V3, color: THREE.ColorRepresentation = 0xffffff, rot: V3 = [0, 0, 0], ink: 'thin' | 'body' | null = 'thin'): void {
    const m = new THREE.Matrix4().compose(V(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(...size));
    let parent: THREE.Object3D = g;
    while (parent.parent && !parent.userData.batchRoot) parent = parent.parent;
    if (parent !== g) {
      // Nested groups: express the matrix in the batch root's space.
      g.updateWorldMatrix(true, false);
      parent.updateWorldMatrix(true, false);
      m.premultiply(new THREE.Matrix4().copy(parent.matrixWorld).invert().multiply(g.matrixWorld));
    }
    b.add(parent, geo, mat, m, { color, ink });
  }
  /** Wooden plant label on a stake. */
  function tag(g: THREE.Object3D, text: string, p: V3, rotY = 0): void {
    const t = new THREE.Group();
    t.position.set(...p);
    t.rotation.y = rotY;
    t.rotation.x = -0.15;
    g.add(t);
    add(UNIT_BOX, M.weathered, t, [0, 0.06, 0], { scale: [0.012, 0.16, 0.008] });
    const face = add(new THREE.BoxGeometry(0.13, 0.05, 0.008), [M.weathered, M.weathered, M.weathered, M.weathered, mapped(0xffffff, label([{ text, size: 40, color: '#3a2a1a' }], '#e7d5b0', 256, 96)), M.weathered] as unknown as THREE.Material, t, [0, 0.15, 0.002]);
    face.castShadow = true;
  }

  // ---------- ground ----------
  // Dark floor disc under the gravel, like the PC workshop's.
  const ground = add(new THREE.CircleGeometry(8.6, 72), toon(0x1d2133, { halftone: 1 }), root, [0, -0.005, 0], { rot: [-Math.PI / 2, 0, 0], ink: null });
  ground.castShadow = false;
  const gravelShape = new THREE.Shape();
  {
    const w = 5.9;
    const d = 4.9;
    const rr = 0.8;
    gravelShape.moveTo(-w + rr, -d);
    gravelShape.lineTo(w - rr, -d);
    gravelShape.quadraticCurveTo(w, -d, w, -d + rr);
    gravelShape.lineTo(w, d - rr);
    gravelShape.quadraticCurveTo(w, d, w - rr, d);
    gravelShape.lineTo(-w + rr, d);
    gravelShape.quadraticCurveTo(-w, d, -w, d - rr);
    gravelShape.lineTo(-w, -d + rr);
    gravelShape.quadraticCurveTo(-w, -d, -w + rr, -d);
  }
  const gravelGeo = new THREE.ShapeGeometry(gravelShape, 8);
  {
    // Planar UVs across the whole patch.
    const pos = gravelGeo.getAttribute('position') as THREE.BufferAttribute;
    const uv = gravelGeo.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 5.9) / 11.8, (pos.getY(i) + 4.9) / 9.8);
  }
  const gravel = add(gravelGeo, M.gravel, root, [0, 0.004, 0], { rot: [-Math.PI / 2, 0, 0], ink: null });
  gravel.castShadow = false;
  // Steel edging around the gravel.
  tube(gravelShape.getSpacedPoints(120).map((p) => V(p.x, 0.02, -p.y)), 0.02, M.galvDark, root, { radial: 4, seg: 240 });

  // Stepping stones: a path up the middle and one across.
  const stones = new THREE.Group();
  stones.userData.batchRoot = true;
  root.add(stones);
  const stone = (x: number, z: number) => inst(stones, UNIT_BOX, M.stone, [x + jitter(r, 0.02), 0.025, z + jitter(r, 0.02)], [0.44, 0.05, 0.44], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.05)), [0, jitter(r, 0.08), 0]);
  for (let z = 4.4; z > -1.7; z -= 0.56) if (Math.abs(z - 1.25) > 0.3) stone(0, z);
  for (let x = -3.6; x < 4.2; x += 0.56) stone(x, 1.25);

  // ---------- raised beds ----------
  function galvBed(g: THREE.Group, w: number, d: number, h: number, front?: THREE.Group): void {
    const sides: [number, number, number, number][] = [
      [0, -d / 2, 0, w],
      [-w / 2, 0, Math.PI / 2, d],
      [w / 2, 0, -Math.PI / 2, d],
    ];
    for (const [x, z, ry, len] of sides) add(corrugated(len, h), M.galv, g, [x, 0, z], { rot: [0, ry, 0] });
    add(corrugated(w, h), M.galv, front ?? g, front ? [0, 0, 0] : [0, 0, d / 2], { rot: [0, Math.PI, 0] });
    // Corner posts and a rolled rim.
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
  const BW = 2.4;
  const BD = 1.2;
  const BH = 0.6;
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
        const tx = label([{ text: L.name, size: 30, color: '#16111f' }], '#fff7d6', 512, 64);
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
  // Greens on top of the cutaway bed.
  {
    const top = BH - 0.03;
    for (let i = 0; i < 4; i++) P.chard(k, bed, V(-0.95 + i * 0.32, top, -0.32), [0xe0344b, 0xffc21a, 0xff7ad8, 0xe0344b][i]);
    for (let i = 0; i < 3; i++) P.kale(k, bed, V(0.4 + i * 0.32, top, -0.3));
    for (let i = 0; i < 7; i++) P.lettuce(k, bed, V(-1.0 + i * 0.3, top, 0.05), { red: i % 2 === 1 });
    for (let i = 0; i < 12; i++) P.carrot(k, bed, V(-1.05 + i * 0.19, top, 0.36));
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
    for (let i = 0; i < 3; i++) P.tomato(k, kitchen, V(-0.75 + i * 0.75, top, -0.22), { cage: true, cageMat: M.steel });
    for (let i = 0; i < 4; i++) P.basil(k, kitchen, V(-1.0 + i * 0.66, top, 0.18));
    for (let i = 0; i < 3; i++) P.marigold(k, kitchen, V(-0.66 + i * 0.66, top, 0.32));
    P.nasturtium(k, kitchen, V(-1.05, top, 0.42));
    P.nasturtium(k, kitchen, V(1.05, top, 0.42));
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
    for (let i = 0; i < 4; i++) P.cabbage(k, tunnel, V(-0.9 + i * 0.6, top, -0.22));
    for (let i = 0; i < 5; i++) P.lettuce(k, tunnel, V(-0.96 + i * 0.48, top, 0.25), { red: i % 2 === 0 });
    // Hoops and the row cover.
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
    // Sandbags hold the edge down.
    for (const x of [-0.8, 0, 0.8]) box(0.2, 0.06, 0.12, toon(0xb39a6a), tunnel, [x, H + 0.03, R + 0.06], { r: 0.03 });
    lidHooks.rowCover = (t) => {
      const sx = lerp(1, 0.2, t);
      cover.scale.x = sx;
      roll.position.x = L / 2 - L * sx;
    };
    pick(tunnel, BW, 1.1, BD, [0, 0.55, 0]);
    tag(tunnel, 'CABBAGE', [1.1, top, 0.45]);
  }

  // ---------- Three Sisters ----------
  const sisters = area('sisters', -1.1, -2.6);
  {
    add(new THREE.CircleGeometry(1.45, 40), M.soil, sisters, [0, 0.008, 0], { rot: [-Math.PI / 2, 0, 0], ink: null }).castShadow = false;
    const hills: [number, number][] = [[0, -0.3], [-0.85, 0.45], [0.8, 0.5]];
    hills.forEach(([hx, hz], hi) => {
      const mound = add(LOW_SPHERE, M.soil, sisters, [hx, 0, hz], { scale: [0.42, 0.13, 0.42], ink: 'thin' });
      mound.castShadow = false;
      for (let c = 0; c < 4; c++) {
        const a = (c / 4) * 6.28 + hi;
        P.corn(k, sisters, V(hx + Math.cos(a) * 0.16, 0.1, hz + Math.sin(a) * 0.16), { beans: c % 2 === 0 });
      }
      const out = Math.atan2(hz, hx);
      P.squash(k, sisters, V(hx + Math.cos(out) * 0.3, 0.06, hz + Math.sin(out) * 0.3), [out + 0.5, out - 0.9]);
    });
    pick(sisters, 2.6, 2.0, 2.4, [0, 1.0, 0]);
  }

  // ---------- compost bays ----------
  const compost = area('compost', 3.55, -3.55);
  {
    const W = 2.7;
    const D = 0.95;
    const H = 0.92;
    const bayW = W / 3;
    const fronts: THREE.Group[] = [];
    for (let i = 0; i <= 3; i++) {
      const x = -W / 2 + i * bayW;
      for (const z of [-D / 2, D / 2]) box(0.08, H + 0.06, 0.08, M.weathered, compost, [x, (H + 0.06) / 2, z], { r: 0.01 });
      // Divider and end walls.
      for (let j = 0; j < 6; j++) inst(compost, UNIT_BOX, M.weathered, [x, 0.09 + j * 0.15, 0], [0.025, 0.12, D - 0.06], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.06)));
    }
    for (let j = 0; j < 6; j++) inst(compost, UNIT_BOX, M.weathered, [0, 0.09 + j * 0.15, -D / 2 - 0.02], [W, 0.12, 0.025], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.06)));
    for (let i = 0; i < 3; i++) {
      const cx = -W / 2 + bayW * (i + 0.5);
      const f = new THREE.Group();
      f.position.set(cx, 0, D / 2 + 0.03);
      compost.add(f);
      fronts.push(f);
      for (let j = 0; j < (i === 2 ? 2 : 4); j++) box(bayW - 0.1, 0.12, 0.025, M.weathered, f, [0, 0.09 + j * 0.15, 0], { r: 0.004 });
      // Piles: fresh scraps, a hot pile, finished compost.
      const pile = [
        mapped(0xffffff, speckle('#5a4a2a', ['#7aa83a', '#e0b040', '#c0602a', '#f0f0e0', '#3a6a2a', '#a07a3a'], 1300, [3, 8], [2, 2], 31)),
        mapped(0xffffff, speckle('#3a2818', ['#5a4028', '#6a5a30', '#2a1a10'], 1000, [2, 6], [2, 2], 32)),
        mapped(0xffffff, speckle('#24170f', ['#1a100a', '#3a2818', '#30200f'], 1000, [1, 4], [2, 2], 33)),
      ][i];
      add(LOW_SPHERE, pile, compost, [cx, 0.05, -0.02], { scale: [bayW * 0.46, [0.62, 0.55, 0.35][i], D * 0.44] });
    }
    // Scraps on the fresh pile.
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
    // Pitchfork leaning on the end.
    {
      const fork = new THREE.Group();
      fork.position.set(W / 2 + 0.12, 0, 0.25);
      fork.rotation.z = 0.22;
      compost.add(fork);
      add(UNIT_CYL, M.handle, fork, [0, 0.75, 0], { scale: [0.016, 1.1, 0.016] });
      box(0.2, 0.03, 0.03, M.steel, fork, [0, 0.2, 0], { r: 0.008 });
      for (let t = 0; t < 4; t++) add(UNIT_CYL, M.steel, fork, [-0.075 + t * 0.05, 0.08, 0], { scale: [0.006, 0.24, 0.006] });
    }
    // Steam off the hot pile.
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(LOW_SPHERE, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      puff.position.set(jitter(r, 0.2), 0.6, -0.02);
      puff.userData.phase = i / 5;
      compost.add(puff);
      steam.push(puff);
    }
    steamBase.set(-W / 2 + bayW * 1.5, 0, 0);
    lidHooks.compostSlats = (t) => fronts.forEach((f, i) => (f.rotation.x = (1.35 - i * 0.05) * t));
    pick(compost, W + 0.3, H + 0.2, D + 0.2, [0, H / 2, 0]);
  }

  // ---------- tool fence (and the fence along the back) ----------
  const tools = area('tools', 0.9, -4.55);
  {
    for (let x = -3.6; x < 4.95; x += 0.155) {
      const h = 1.55 + (Math.round(x / 0.155) % 2 ? 0 : 0.03);
      inst(tools, UNIT_BOX, M.cedar, [x, h / 2, 0], [0.14, h, 0.022], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.05)));
    }
    for (const y of [0.3, 1.3]) inst(tools, UNIT_BOX, M.cedarDark, [0.65, y, -0.04], [8.6, 0.09, 0.04]);
    for (let x = -3.6; x < 5; x += 2.2) box(0.1, 1.7, 0.1, M.cedarDark, tools, [x, 0.85, -0.08], { r: 0.01 });
    // Tool rail with pegs.
    box(1.9, 0.07, 0.04, M.cedarDark, tools, [0.0, 1.32, 0.04], { r: 0.008 });
    const hang = (x: number, build: (g: THREE.Group) => void, tilt = 0) => {
      const g = new THREE.Group();
      g.position.set(x, 1.32, 0.08);
      g.rotation.z = tilt;
      tools.add(g);
      add(UNIT_CYL, M.steel, g, [0, 0, -0.02], { rot: [Math.PI / 2, 0, 0], scale: [0.008, 0.08, 0.008], ink: null });
      build(g);
      toolSwing.push(g);
    };
    // Spade: D-grip, shaft, blade.
    hang(-0.75, (g) => {
      add(new THREE.TorusGeometry(0.05, 0.012, 6, 16), M.handle, g, [0, 0.0, 0]);
      add(UNIT_CYL, M.handle, g, [0, -0.45, 0], { scale: [0.016, 0.85, 0.016] });
      box(0.19, 0.28, 0.012, M.blade, g, [0, -0.98, 0], { r: 0.02 });
    });
    // Rake.
    hang(-0.4, (g) => {
      add(UNIT_CYL, M.handle, g, [0, -0.62, 0], { scale: [0.014, 1.25, 0.014] });
      box(0.36, 0.03, 0.03, M.steel, g, [0, -1.26, 0], { r: 0.008 });
      for (let t = 0; t < 12; t++) add(UNIT_CYL, M.steel, g, [-0.165 + t * 0.03, -1.3, 0.012], { scale: [0.004, 0.06, 0.004], ink: null });
    });
    // Hoe.
    hang(-0.08, (g) => {
      add(UNIT_CYL, M.handle, g, [0, -0.6, 0], { scale: [0.014, 1.2, 0.014] });
      box(0.15, 0.1, 0.01, M.blade, g, [0, -1.22, 0.03], { rot: [0.5, 0, 0], r: 0.008 });
    });
    // Loppers: two long handles, crossing blades.
    hang(0.3, (g) => {
      for (const s2 of [-1, 1]) {
        add(UNIT_CYL, M.red, g, [s2 * 0.05, -0.3, 0], { rot: [0, 0, s2 * 0.12], scale: [0.013, 0.5, 0.013] });
        box(0.03, 0.15, 0.008, M.blade, g, [-s2 * 0.012, -0.62, 0.008 * s2], { rot: [0, 0, -s2 * 0.25], r: 0.004 });
      }
    });
    // Hand pruners and a trowel on short pegs.
    hang(0.6, (g) => {
      for (const s2 of [-1, 1]) add(UNIT_CYL, M.red, g, [s2 * 0.018, -0.07, 0], { rot: [0, 0, s2 * 0.18], scale: [0.012, 0.13, 0.012] });
      box(0.02, 0.07, 0.006, M.blade, g, [0, -0.17, 0.004], { r: 0.003 });
    });
    hang(0.85, (g) => {
      add(UNIT_CYL, M.handle, g, [0, -0.07, 0], { scale: [0.016, 0.13, 0.016] });
      add(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI), M.blade, g, [0, -0.2, -0.0], { scale: [0.7, 1.4, 0.35], rot: [0, 0, 0] });
    });
    // Watering can at the foot of the fence.
    const can = new THREE.Group();
    can.position.set(1.4, 0, 0.35);
    can.rotation.y = -0.5;
    tools.add(can);
    add(new THREE.CylinderGeometry(0.12, 0.13, 0.26, 18), M.galv, can, [0, 0.13, 0]);
    tube([V(0.1, 0.06, 0), V(0.22, 0.2, 0), V(0.3, 0.3, 0)], 0.014, M.galv, can);
    add(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), M.galv, can, [-0.02, 0.26, 0]);
    // Wheelbarrow.
    const wb = new THREE.Group();
    wb.position.set(-0.3, 0, 0.75);
    wb.rotation.y = 0.35;
    tools.add(wb);
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 18), toon(0x2a2a2e), wb, [0.55, 0.15, 0], { rot: [Math.PI / 2, 0, 0] });
    const tray = new THREE.CylinderGeometry(0.34, 0.22, 0.24, 4, 1, true);
    tray.rotateY(Math.PI / 4);
    tray.scale(1.3, 1, 0.9);
    add(tray, toon(0x2f7a5a, { shine: 0.4, side: THREE.DoubleSide }), wb, [0.1, 0.42, 0]);
    for (const z of [-0.18, 0.18]) {
      add(UNIT_CYL, M.steel, wb, [-0.15, 0.3, z], { rot: [0, 0, 1.25], scale: [0.015, 1.1, 0.015] });
      add(UNIT_CYL, M.steel, wb, [-0.15, 0.15, z], { scale: [0.012, 0.3, 0.012] });
    }
    // Clematis climbing the fence on the left.
    P.climber(k, tools, [V(-3.4, 0, 0.06), V(-3.1, 0.7, 0.07), V(-2.6, 1.3, 0.06), V(-2.0, 1.45, 0.07), V(-1.5, 1.2, 0.06)], { leaf: 0x3f7a3a, flowers: [0x8a5ad8, 0xb07ae8], petals: 6, flowerSize: 0.05 });
    pick(tools, 2.4, 1.7, 1.4, [0.0, 0.85, 0.5]);
  }

  // ---------- shed pantry ----------
  const pantry = area('pantry', -4.25, -3.15);
  {
    const W = 2.0;
    const D = 1.6;
    const H = 2.05;
    const doorW = 1.1;
    const doorH = 1.8;
    box(W + 0.1, 0.12, D + 0.1, M.stone, pantry, [0, 0.06, 0], { r: 0.01 });
    const y0 = 0.12;
    box(0.06, H, D, M.shedWall, pantry, [-W / 2, y0 + H / 2, 0], { r: 0.005 });
    box(0.06, H, D, M.shedWall, pantry, [W / 2, y0 + H / 2, 0], { r: 0.005 });
    box(W, H, 0.06, M.shedWall, pantry, [0, y0 + H / 2, -D / 2], { r: 0.005 });
    const sideW = (W - doorW) / 2;
    box(sideW, H, 0.06, M.shedWall, pantry, [-W / 2 + sideW / 2, y0 + H / 2, D / 2], { r: 0.005 });
    box(sideW, H, 0.06, M.shedWall, pantry, [W / 2 - sideW / 2, y0 + H / 2, D / 2], { r: 0.005 });
    box(doorW, H - doorH, 0.06, M.shedWall, pantry, [0, y0 + doorH + (H - doorH) / 2, D / 2], { r: 0.005 });
    // Gables and roof.
    const gable = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, 0.62)]);
    const gGeo = new THREE.ExtrudeGeometry(gable, { depth: 0.05, bevelEnabled: false });
    add(gGeo, M.shedWall, pantry, [0, y0 + H, D / 2 - 0.05]);
    add(gGeo, M.shedWall, pantry, [0, y0 + H, -D / 2]);
    const pitch = Math.atan2(0.62, W / 2);
    const slope = Math.hypot(0.62, W / 2) + 0.2;
    for (const sd of [-1, 1]) {
      box(slope, 0.05, D + 0.3, M.roof, pantry, [sd * (W / 4 + 0.05), y0 + H + 0.33, 0], { rot: [0, 0, -sd * pitch], r: 0.01 });
    }
    box(0.08, 0.08, D + 0.34, M.trim, pantry, [0, y0 + H + 0.66, 0], { r: 0.01 });
    // Trim and a sign.
    for (const x of [-doorW / 2 - 0.04, doorW / 2 + 0.04]) box(0.07, doorH + 0.06, 0.03, M.trim, pantry, [x, y0 + doorH / 2, D / 2 + 0.03], { r: 0.008 });
    box(doorW + 0.15, 0.07, 0.03, M.trim, pantry, [0, y0 + doorH + 0.04, D / 2 + 0.03], { r: 0.008 });
    const sign = add(new THREE.BoxGeometry(0.62, 0.16, 0.02), [M.trim, M.trim, M.trim, M.trim, mapped(0xffffff, label([{ text: 'PANTRY', size: 54, color: '#2a3a4a' }], '#f1ece0', 384, 100)), M.trim] as unknown as THREE.Material, pantry, [0, y0 + H + 0.22, D / 2 + 0.02]);
    sign.castShadow = true;
    // Doors swing out from the outer edges.
    const doors: THREE.Group[] = [];
    for (const sd of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(sd * doorW / 2, y0, D / 2 + 0.03);
      pantry.add(hinge);
      const leaf = new THREE.Group();
      hinge.add(leaf);
      box(doorW / 2 - 0.01, doorH, 0.04, M.shedWall, leaf, [-sd * (doorW / 4), doorH / 2, 0], { r: 0.006 });
      // Z-brace.
      for (const y of [0.25, doorH - 0.25]) box(doorW / 2 - 0.06, 0.08, 0.02, M.trim, leaf, [-sd * (doorW / 4), y, 0.03], { r: 0.006 });
      box(0.07, doorH - 0.5, 0.02, M.trim, leaf, [-sd * (doorW / 4), doorH / 2, 0.03], { rot: [0, 0, sd * 0.55], r: 0.006 });
      add(UNIT_CYL, M.galvDark, leaf, [-sd * (doorW / 2 - 0.06), doorH * 0.5, 0.05], { scale: [0.012, 0.16, 0.012] });
      doors.push(hinge);
      hinge.userData.side = sd;
    }
    lidHooks.shedDoors = (t) => doors.forEach((d) => (d.rotation.y = d.userData.side * 1.95 * t));
    // Inside: shelves of jars, crates, garlic and herbs drying.
    const shelfX = 0;
    for (const [y, z, w] of [[0.55, -D / 2 + 0.2, W - 0.14], [1.0, -D / 2 + 0.2, W - 0.14], [1.45, -D / 2 + 0.2, W - 0.14]] as const) {
      box(w, 0.03, 0.3, M.weathered, pantry, [shelfX, y0 + y, z], { r: 0.004 });
    }
    for (const x of [-W / 2 + 0.25, W / 2 - 0.25]) box(0.04, 1.5, 0.04, M.weathered, pantry, [x, y0 + 0.75, -D / 2 + 0.07]);
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
    // Crates of potatoes, onions and winter squash.
    const crate = (x: number, z: number, col: number, n: number, sz: number) => {
      box(0.42, 0.24, 0.32, M.weathered, pantry, [x, y0 + 0.12, z], { r: 0.01 });
      for (let i = 0; i < n; i++) inst(pantry, LOW_SPHERE, white, [x + jitter(r, 0.15), y0 + 0.25 + r() * 0.03, z + jitter(r, 0.1)], [sz, sz * 0.8, sz * 0.9], new THREE.Color(col).offsetHSL(0, 0, jitter(r, 0.05)));
    };
    crate(-0.55, D / 2 - 0.55, 0xb08a5a, 10, 0.045);
    crate(-0.55, D / 2 - 0.95, 0xd8a24a, 10, 0.04);
    inst(pantry, P.PUMPKIN, white, [0.6, y0 + 0.1, D / 2 - 0.6], [0.14, 0.14, 0.14], 0xe8a85a);
    inst(pantry, P.PUMPKIN, white, [0.7, y0 + 0.08, D / 2 - 0.95], [0.11, 0.11, 0.11], 0x5a7a3a);
    // Garlic braid and herb bundles hanging from the ridge beam.
    box(W - 0.1, 0.06, 0.06, M.weathered, pantry, [0, y0 + H - 0.08, 0.1]);
    for (let i = 0; i < 5; i++) {
      const x = -0.7 + i * 0.35;
      inst(pantry, UNIT_CYL, white, [x, y0 + H - 0.2, 0.1], [0.004, 0.2, 0.004], 0x8a7a5a, [0, 0, 0], null);
      if (i % 2 === 0) for (let j = 0; j < 5; j++) inst(pantry, LOW_SPHERE, white, [x + jitter(r, 0.02), y0 + H - 0.34 - j * 0.07, 0.1], [0.032, 0.038, 0.032], 0xf0e6d6);
      else inst(pantry, new THREE.ConeGeometry(1, 1, 8), white, [x, y0 + H - 0.4, 0.1], [0.06, 0.24, 0.06], [0x6a8a5a, 0x8a9a7a][i % 2], [Math.PI, 0, 0]);
    }
    // A window with a flower box on the side facing the garden.
    box(0.05, 0.55, 0.65, toon(0x9fd8f0, { shine: 0.9 }), pantry, [W / 2 + 0.01, y0 + 1.35, 0.1], { r: 0.005 });
    box(0.07, 0.62, 0.72, M.trim, pantry, [W / 2 + 0.005, y0 + 1.35, 0.1], { r: 0.008 });
    box(0.18, 0.16, 0.7, M.cedar, pantry, [W / 2 + 0.11, y0 + 0.98, 0.1], { r: 0.01 });
    P.nasturtium(k, pantry, V(W / 2 + 0.11, y0 + 1.05, -0.12));
    P.marigold(k, pantry, V(W / 2 + 0.11, y0 + 1.05, 0.18), 0xffc21a);
    pick(pantry, W + 0.2, H + 0.7, D + 0.2, [0, (H + 0.7) / 2, 0]);
    // Gutter and downspout to the rain barrel (part of the water area visually).
    add(UNIT_CYL, M.galv, pantry, [W / 2 + 0.16, y0 + H - 0.05, 0], { rot: [Math.PI / 2, 0, 0], scale: [0.045, D + 0.3, 0.045] });
    tube([V(W / 2 + 0.16, y0 + H - 0.05, D / 2 + 0.1), V(W / 2 + 0.18, y0 + H - 0.4, D / 2 + 0.14), V(W / 2 + 0.3, 1.3, D / 2 + 0.36), V(W / 2 + 0.3, 1.12, D / 2 + 0.36)], 0.035, M.galv, pantry, { radial: 8 });
  }

  // ---------- rain barrel and watering ----------
  // Under the shed's front-east downspout, in view from the main path.
  const WX = -3.05, WZ = -1.99;
  const water = area('water', WX, WZ);
  {
    for (const x of [-0.13, 0.13]) box(0.2, 0.2, 0.4, M.stone, water, [x, 0.1, 0], { r: 0.01 });
    const barrel = new THREE.LatheGeometry([0, 0.3, 0.32, 0.33, 0.32, 0.3, 0].map((rr, i) => new THREE.Vector2(rr, [0, 0, 0.15, 0.45, 0.75, 0.9, 0.9][i])), 24);
    add(barrel, M.barrel, water, [0, 0.2, 0], { ink: 'body' });
    for (const y of [0.35, 0.6, 0.85]) add(new THREE.TorusGeometry(0.325, 0.012, 6, 32), M.barrel, water, [0, y, 0], { rot: [Math.PI / 2, 0, 0], ink: null });
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 18), M.galvDark, water, [0, 1.11, 0]);
    // Spigot and hose.
    add(UNIT_CYL, M.brass, water, [0.18, 0.32, 0.27], { rot: [Math.PI / 2, 0, 0], scale: [0.018, 0.1, 0.018] });
    add(UNIT_CYL, M.brass, water, [0.18, 0.3, 0.33], { scale: [0.014, 0.05, 0.014] });
    spigot.set(WX + 0.18, 0.27, WZ + 0.33);
    // Hose runs to the drip header behind the raised bed.
    const hose: THREE.Vector3[] = [V(0.18, 0.27, 0.34), V(0.26, 0.03, 0.55), V(0.22, 0.02, 0.95), V(0.25, 0.02, 1.22)];
    tube(hose, 0.016, M.hose, water, { seg: 80 });
    pick(water, 0.9, 1.3, 0.9, [0, 0.65, 0]);
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
        for (let i = 0; i < 8; i++) inst(beds, UNIT_CYL, M.drip, [x0 - 1.0 + i * 0.28, top + 0.005, z], [0.012, 0.012, 0.012], 0xffffff, [0, 0, 0], null);
      }
    }
  }

  // ---------- hydroponics ----------
  const hydro = area('hydro', 2.0, 2.65);
  {
    // Brick base, as in the photo, holds the reservoir or the frame.
    // The NFT rack stands on the ground, so its reservoir gets a smaller base beside it.
    const nftMode = s.hydro === 'nft';
    const baseX = nftMode ? -0.82 : 0;
    for (let row = 0; row < 3; row++) inst(hydro, UNIT_BOX, M.brick, [baseX, 0.06 + row * 0.12, 0], nftMode ? [0.78, 0.12, 0.62] : [1.3, 0.12, 0.7], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.04)));
    const baseTop = 0.36;
    const net = toon(0x2a2a2e);
    const cup = (g: THREE.Object3D, p: THREE.Vector3, dir: THREE.Vector3, plant: number) => {
      add(UNIT_CYL, M.pvc, g, [p.x, p.y, p.z], { scale: [0.04, 0.07, 0.04], rot: [Math.atan2(dir.z, dir.y), 0, -Math.atan2(dir.x, dir.y)] });
      inst(g, UNIT_CYL, net, [p.x, p.y + 0.03, p.z], [0.032, 0.02, 0.032], 0xffffff, [0, 0, 0], null);
      const at = V(p.x, p.y + 0.04, p.z);
      if (plant === 0) P.lettuce(k, hydro, at, { s: 0.6, red: r() > 0.6 });
      else if (plant === 1) P.strawberry(k, hydro, at);
      else P.basil(k, hydro, at);
    };
    if (s.hydro === 'tower') {
      // Reservoir tote at the bottom with the pump, three vertical towers.
      box(1.1, 0.34, 0.5, M.tote, hydro, [0, baseTop + 0.17, 0], { r: 0.03 });
      add(UNIT_CYL, M.pvc, hydro, [0, baseTop + 0.4, 0], { rot: [0, 0, Math.PI / 2], scale: [0.05, 1.05, 0.05] });
      for (let t = 0; t < 3; t++) {
        const x = -0.38 + t * 0.38;
        const H = 1.55;
        add(UNIT_CYL, M.pvc, hydro, [x, baseTop + 0.4 + H / 2, 0], { scale: [0.06, H, 0.06] });
        add(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 14), M.pvc, hydro, [x, baseTop + 0.4 + H + 0.02, 0]);
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
      box(0.66, 0.3, 0.5, M.tote, hydro, [baseX, baseTop + 0.15, 0], { r: 0.03 });
      const RX = 0.42;
      for (const sd of [-1, 1]) {
        add(UNIT_BOX, M.weathered, hydro, [RX + sd * 0.6, 0.72, -0.05], { scale: [0.05, 1.45, 0.05], rot: [0.32, 0, 0] });
        add(UNIT_BOX, M.weathered, hydro, [RX + sd * 0.6, 0.72, 0.4], { scale: [0.05, 1.45, 0.05], rot: [-0.32, 0, 0] });
        add(UNIT_BOX, M.weathered, hydro, [RX + sd * 0.6, 0.3, 0.175], { scale: [0.04, 0.04, 0.62] });
      }
      for (let lvl = 0; lvl < 3; lvl++) {
        for (const sd of [-1, 1]) {
          const y = 0.42 + lvl * 0.38;
          const z = 0.18 + sd * (0.34 - lvl * 0.12);
          box(1.3, 0.08, 0.1, M.pvc, hydro, [RX, y, z], { rot: [0, 0, 0.03], r: 0.025 });
          for (let i = 0; i < 5; i++) cup(hydro, V(RX - 0.44 + i * 0.22, y + 0.04 + i * 0.0066, z), UP, (i + lvl) % 3 === 1 ? 2 : 0);
        }
      }
      // Drain from the low ends into the tote, feed hose from the pump up to the high ends.
      tube([V(RX - 0.66, 1.1, 0.18), V(RX - 0.7, 0.75, 0.18), V(baseX + 0.2, baseTop + 0.4, 0.1), V(baseX + 0.15, baseTop + 0.28, 0.05)], 0.02, M.pvc, hydro, { seg: 24 });
      tube([V(baseX - 0.1, baseTop + 0.3, -0.05), V(baseX - 0.05, baseTop + 0.55, -0.2), V(RX, 1.45, -0.25), V(RX + 0.68, 1.3, 0.18)], 0.012, M.hose, hydro, { seg: 30 });
    } else {
      // Deep water culture: a tote with a floating raft and an air pump.
      box(1.2, 0.36, 0.6, M.tote, hydro, [0, baseTop + 0.18, 0], { r: 0.03 });
      box(1.1, 0.04, 0.52, toon(0xf4f4f0), hydro, [0, baseTop + 0.37, 0], { r: 0.01 });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cup(hydro, V(-0.42 + i * 0.28, baseTop + 0.38, -0.12 + j * 0.24), UP, i === 3 ? 2 : 0);
      box(0.18, 0.1, 0.12, toon(0x2a2a2e), hydro, [0.75, 0.05, 0.3], { r: 0.02 });
      tube([V(0.75, 0.1, 0.3), V(0.7, 0.4, 0.3), V(0.55, 0.6, 0.25), V(0.4, 0.58, 0.2)], 0.006, toon(0xe8f4ff), hydro, { seg: 20, ink: null });
    }
    pick(hydro, nftMode ? 2.3 : 1.4, 2.4, 0.9, [nftMode ? -0.1 : 0, 1.2, 0]);
  }

  // ---------- herb spiral ----------
  const herbs = area('herbs', -4.3, 1.35);
  {
    const turns = 1.3;
    const R0 = 1.0;
    const rad = (t: number) => R0 - 0.7 * t;
    const wall = (t: number) => 0.12 + 0.46 * t;
    // Terraced soil: each point sits just under the wall that encloses it from outside.
    {
      const A = 120;
      const S = 18;
      const posA: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= A; i++) {
        const th = (i / A) * Math.PI * 2;
        const t0 = th / (Math.PI * 2 * turns);
        const outer = rad(t0) - 0.04;
        for (let j = 0; j <= S; j++) {
          const rr = outer * (1 - j / S);
          let tk = t0;
          for (let kk = 1; kk < 4; kk++) {
            const t2 = t0 + kk / turns;
            if (t2 > 1 || rad(t2) + 0.06 < rr) break;
            tk = t2;
          }
          const top = rr < rad(1) - 0.06 ? wall(1) + 0.02 : wall(tk) - 0.03;
          posA.push(Math.cos(th) * rr, top, Math.sin(th) * rr);
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
      add(sg, mapped(0xffffff, speckle('#4a3222', ['#3a2618', '#5d4030', '#2c1c12', '#6a4a35'], 900, [2, 5], [1, 1], 4), { side: THREE.DoubleSide }), herbs, [0, 0, 0], { ink: null });
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
    P.rosemary(k, herbs, V(0, 0.76, 0));
    P.lavender(k, herbs, at(0.86, 0.12));
    P.thyme(k, herbs, at(0.74), 0.16);
    P.sage(k, herbs, at(0.62));
    P.chives(k, herbs, at(0.48));
    P.chamomile(k, herbs, at(0.36));
    P.basil(k, herbs, at(0.24));
    P.thyme(k, herbs, at(0.14), 0.12);
    // Marshmallow loves the damp foot of the spiral.
    P.marshmallow(k, herbs, V(0.95, 0, -0.75));
    P.marshmallow(k, herbs, V(1.25, 0, -0.35));
    tag(herbs, 'MARSHMALLOW', [1.2, 0, -0.75], -0.8);
    tag(herbs, 'ROSEMARY', [0.25, 0.74, 0.15], 0.4);
    // Terracotta pots by the spiral.
    for (const [x, z, sz] of [[0.9, 0.8, 1], [1.15, 0.55, 0.75]] as const) {
      add(new THREE.CylinderGeometry(0.13 * sz, 0.09 * sz, 0.2 * sz, 16), M.terracotta, herbs, [x, 0.1 * sz, z]);
      add(new THREE.TorusGeometry(0.13 * sz, 0.018, 6, 18), M.terracotta, herbs, [x, 0.2 * sz, z], { rot: [Math.PI / 2, 0, 0] });
      P.thyme(k, herbs, V(x, 0.2 * sz, z), 0.1 * sz);
    }
    pick(herbs, 2.4, 1.4, 2.4, [0.2, 0.7, 0]);
  }

  // ---------- fruit corner ----------
  const fruit = area('fruit', 4.85, -1.25);
  {
    add(new THREE.CircleGeometry(0.9, 28), mapped(0xffffff, speckle('#6a4a2a', ['#8a5a32', '#4a3020', '#a0703a'], 800, [3, 8], [2, 2], 41)), fruit, [0, 0.01, -1.0], { rot: [-Math.PI / 2, 0, 0], ink: null }).castShadow = false;
    P.pawpaw(k, fruit, V(0, 0, -1.0));
    P.goji(k, fruit, V(0.1, 0, 0.55));
    // Blueberry in a half barrel of acidic mix.
    const bx = -0.8;
    const bz = 1.35;
    add(new THREE.CylinderGeometry(0.4, 0.34, 0.42, 20), M.cedar, fruit, [bx, 0.21, bz], { ink: 'body' });
    for (const y of [0.08, 0.34]) add(new THREE.TorusGeometry(0.39, 0.012, 6, 28), M.galvDark, fruit, [bx, y, bz], { rot: [Math.PI / 2, 0, 0], ink: null });
    add(new THREE.CircleGeometry(0.37, 20), mapped(0xffffff, speckle('#7a4a2a', ['#9a5a32', '#5a3020'], 400, [3, 7], [1, 1], 42)), fruit, [bx, 0.41, bz], { rot: [-Math.PI / 2, 0, 0], ink: null });
    P.blueberry(k, fruit, V(bx, 0.4, bz));
    tag(fruit, 'PAWPAW', [-0.45, 0, -0.55]);
    tag(fruit, 'GOJI', [-0.35, 0, 0.6]);
    if (season === 'fall') {
      // Fallen pawpaw leaves.
      for (let i = 0; i < 40; i++) {
        const a = r() * 6.28;
        const rr = Math.sqrt(r()) * 1.3;
        const m = new THREE.Matrix4().compose(V(Math.cos(a) * rr, 0.012, -1.0 + Math.sin(a) * rr), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + jitter(r, 0.2), 0, r() * 6.28)), V(0.2, 0.2, 0.2));
        b.add(fruit, P.LEAVES.obovate, k.leaf, m, { color: new THREE.Color(0xe8b030).offsetHSL(jitter(r, 0.03), 0, jitter(r, 0.1)), ink: 'thin', wind: WIND });
      }
    }
    pick(fruit, 1.6, 3.2, 3.6, [0, 1.6, -0.2]);
  }

  // ---------- pollinator patch ----------
  const pollinators = area('pollinators', 4.45, 3.15);
  {
    add(new THREE.CircleGeometry(1.3, 28), M.soil, pollinators, [0, 0.008, 0], { rot: [-Math.PI / 2, 0, 0], ink: null }).castShadow = false;
    for (let i = 0; i < 4; i++) P.sunflower(k, pollinators, V(-0.75 + i * 0.5, 0, -0.55 + jitter(r, 0.1)), Math.PI / 2 - 0.3 + jitter(r, 0.3));
    const zc = [0xff3d7f, 0xff8a2a, 0xffd23f, 0xd83a5a, 0xff6ad8];
    for (let i = 0; i < 6; i++) P.zinnia(k, pollinators, V(-0.9 + i * 0.36, 0, 0.15 + jitter(r, 0.1)), zc[i % zc.length]);
    for (let i = 0; i < 4; i++) P.cosmos(k, pollinators, V(-0.7 + i * 0.45, 0, 0.65 + jitter(r, 0.1)), [0xff8ad8, 0xffffff, 0xd84a9a][i % 3]);
    P.beeBalm(k, pollinators, V(-1.0, 0, 0.45), 0xe0283f);
    P.beeBalm(k, pollinators, V(0.95, 0, 0.5), 0xa04ad0);
    for (let i = 0; i < 3; i++) P.echinacea(k, pollinators, V(-0.45 + i * 0.45 + jitter(r, 0.06), 0, 0.98 + jitter(r, 0.06)));
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.2 + i * 0.15);
      P.alyssum(k, pollinators, V(Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18));
    }
    // Bee hotel on a post.
    const hotel = new THREE.Group();
    hotel.position.set(1.15, 0, -0.2);
    hotel.rotation.y = -0.5;
    pollinators.add(hotel);
    box(0.07, 1.2, 0.07, M.cedarDark, hotel, [0, 0.6, 0]);
    box(0.36, 0.42, 0.18, M.cedar, hotel, [0, 1.36, 0], { r: 0.01 });
    const roofG = new THREE.CylinderGeometry(0.01, 0.3, 0.14, 4, 1);
    roofG.rotateY(Math.PI / 4);
    add(roofG, M.roof, hotel, [0, 1.64, 0], { scale: [1, 1, 0.7] });
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
    add(new THREE.PlaneGeometry(0.3, 0.36), holes, hotel, [0, 1.36, 0.092], { ink: null });
    pick(pollinators, 2.6, 2.2, 2.0, [0, 1.1, 0]);
  }

  // ---------- potting bench ----------
  const seedlings = area('seedlings', -4.9, -0.75, Math.PI / 2);
  {
    const W = 1.5;
    const D = 0.6;
    const H = 0.85;
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.06, H, 0.06, M.weathered, seedlings, [(x * (W - 0.1)) / 2, H / 2, (z * (D - 0.1)) / 2]);
    for (let i = 0; i < 6; i++) inst(seedlings, UNIT_BOX, M.weathered, [0, H, -D / 2 + 0.05 + i * 0.1], [W, 0.03, 0.09], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.05)));
    box(W, 0.03, D - 0.1, M.weathered, seedlings, [0, 0.25, 0]);
    box(W, 0.5, 0.03, M.weathered, seedlings, [0, H + 0.25, -D / 2]);
    box(W, 0.03, 0.2, M.weathered, seedlings, [0, H + 0.45, -D / 2 + 0.1]);
    // Seed trays with sprouts in every cell.
    const tray = toon(0x23252b);
    const cotyledon = P.LEAVES.ovateCup;
    for (const tx of [-0.42, 0.12]) {
      box(0.5, 0.06, 0.28, tray, seedlings, [tx, H + 0.045, 0.05], { r: 0.008 });
      for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
        const p = V(tx - 0.21 + i * 0.06, H + 0.075, 0.05 - 0.09 + j * 0.06);
        inst(seedlings, UNIT_BOX, M.soil, [p.x, p.y, p.z], [0.05, 0.005, 0.05], 0xffffff, [0, 0, 0], null);
        const base = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(UP, r() * 6), V(1, 1, 1));
        const sz = season === 'spring' ? 0.03 : 0.022;
        for (const sd of [-1, 1]) b.add(seedlings, cotyledon, k.leaf, base.clone().multiply(leafMatrix(V(0, 0.02, 0), V(sd, 0.6, 0), UP, sz)), { color: 0x7cc957, ink: 'thin', wind: WIND });
        b.add(seedlings, P.CYL, k.plain, base.clone().multiply(new THREE.Matrix4().makeScale(0.002, 0.022, 0.002)), { color: 0x9ad06a, ink: null, wind: WIND });
      }
    }
    // Pots on the top shelf and the bench.
    for (let i = 0; i < 5; i++) {
      const x = -0.6 + i * 0.3;
      add(new THREE.CylinderGeometry(0.07, 0.05, 0.11, 14), M.terracotta, seedlings, [x, H + 0.52, -D / 2 + 0.1]);
      if (i % 2 === 0) P.basil(k, seedlings, V(x, H + 0.57, -D / 2 + 0.1));
      else P.strawberry(k, seedlings, V(x, H + 0.57, -D / 2 + 0.1));
    }
    add(new THREE.CylinderGeometry(0.1, 0.075, 0.15, 14), M.terracotta, seedlings, [0.6, H + 0.09, 0.05]);
    P.tomato(k, seedlings, V(0.6, H + 0.16, 0.05));
    // Bag of seed-starting mix under the bench.
    box(0.45, 0.32, 0.22, toon(0x3f8a5a), seedlings, [-0.4, 0.43, 0], { r: 0.06 });
    pick(seedlings, W + 0.1, 1.5, D + 0.2, [0, 0.75, 0]);
  }

  // ---------- arbor ----------
  const arbor = area('arbor', 0, 4.25);
  {
    const H = 2.2;
    for (const x of [-0.7, 0.7]) for (const z of [-0.32, 0.32]) box(0.1, H, 0.1, M.cedar, arbor, [x, H / 2, z], { r: 0.01 });
    for (const z of [-0.32, 0.32]) box(2.1, 0.16, 0.06, M.cedar, arbor, [0, H - 0.05, z], { r: 0.01 });
    for (let i = 0; i < 6; i++) box(0.05, 0.08, 0.95, M.cedar, arbor, [-0.85 + i * 0.34, H + 0.07, 0], { r: 0.008 });
    // Lattice sides.
    for (const x of [-0.7, 0.7]) {
      for (let y = 0.55; y < 1.9; y += 0.3) for (const z of [-0.13, 0.13]) for (const sd of [-1, 1]) inst(arbor, UNIT_BOX, M.cedar, [x, y, z], [0.02, 0.36, 0.025], 0xffffff, [sd * 0.72, 0, 0]);
    }
    for (const x of [-0.7, 0.7]) for (let i = 0; i < 4; i++) inst(arbor, UNIT_BOX, M.cedar, [x, 0.4 + i * 0.4, 0], [0.025, 0.025, 0.62]);
    // Roses up both sides and over the top.
    for (const sd of [-1, 1]) {
      P.climber(k, arbor, [V(sd * 0.75, 0, 0.36), V(sd * 0.72, 0.8, 0.3), V(sd * 0.7, 1.6, 0.32), V(sd * 0.55, 2.25, 0.2), V(sd * 0.1, 2.32, 0.0)], { leaf: 0x3b6b35, flowers: sd < 0 ? [0xff6f91, 0xff3d6a] : [0xffffff, 0xffd0dc], petals: 5, flowerSize: 0.05, density: 46 });
    }
    // Low lavender either side of the entry.
    for (const sd of [-1, 1]) P.lavender(k, arbor, V(sd * 1.15, 0, 0.1));
    pick(arbor, 2.2, 2.5, 0.9, [0, 1.25, 0]);
  }

  // ---------- wildlife ----------
  const critters = new THREE.Group();
  root.add(critters);
  const bodyMat = mapped(0xffffff, canvasTex(32, 16, (ctx) => {
    ctx.fillStyle = '#f2c21a';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#1a1410';
    for (let x = 4; x < 32; x += 8) ctx.fillRect(x, 0, 4, 16);
  }));
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const flowersAt = [V(4.45, 1.6, 3.0), V(1.75, 0.8, 0.3), V(-4.3, 0.9, 1.3), V(0, 2.1, 4.25), V(-1.3, 1.3, -2.5), V(4.8, 1.0, -0.6)];
  type Critter = { g: THREE.Group; wings: THREE.Mesh[]; home: THREE.Vector3; speed: number; phase: number; rad: number; bee: boolean };
  const bugs: Critter[] = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    const bodyG = new THREE.CapsuleGeometry(0.018, 0.03, 3, 8);
    bodyG.rotateZ(Math.PI / 2);
    add(bodyG, bodyMat, g, [0, 0, 0], { ink: 'thin' });
    const wings: THREE.Mesh[] = [];
    for (const sd of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10).translate(0, 0, 0.022), wingMat);
      w.position.set(0, 0.015, 0);
      w.userData.side = sd;
      g.add(w);
      wings.push(w);
    }
    critters.add(g);
    bugs.push({ g, wings, home: flowersAt[i % flowersAt.length].clone(), speed: range(r, 1.4, 2.4), phase: r() * 6.28, rad: range(r, 0.25, 0.6), bee: true });
  }
  const bfly = [0xff8a1a, 0xffffff, 0x6ec8ff, 0xffd23f];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    add(new THREE.CapsuleGeometry(0.007, 0.04, 3, 6), toon(0x1a1410), g, [0, 0, 0], { rot: [Math.PI / 2, 0, 0], ink: null });
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.03, 0.05, 0.08, 0.04, 0.07, 0.0);
    shape.bezierCurveTo(0.08, -0.04, 0.03, -0.05, 0, 0);
    const wg = new THREE.ShapeGeometry(shape, 8);
    wg.rotateX(-Math.PI / 2);
    const wm = toon(bfly[i % bfly.length], { side: THREE.DoubleSide });
    const wings: THREE.Mesh[] = [];
    for (const sd of [-1, 1]) {
      const w = add(wg, wm, g, [0, 0, 0], { ink: 'thin', scale: [sd, 1, 1] });
      w.userData.side = sd;
      wings.push(w);
    }
    critters.add(g);
    bugs.push({ g, wings, home: flowersAt[(i * 2 + 1) % flowersAt.length].clone().add(V(0, 0.3, 0)), speed: range(r, 0.5, 0.8), phase: r() * 6.28, rad: range(r, 0.6, 1.1), bee: false });
  }
  if (season === 'fall') bugs.splice(6, 4);

  b.flush();

  // ---------- glow lists, beacons and views ----------
  const glow = new Map<AreaId, THREE.Mesh[]>();
  for (const [id, g] of areas) {
    const list: THREE.Mesh[] = [];
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      // Everything visible except ink hulls and invisible pick boxes: the outline traces its silhouette.
      const mat = m.material as THREE.Material & { isLineMaterial?: boolean; opacity: number };
      if (m.isMesh && !m.userData.ink && mat.visible !== false && !mat.isLineMaterial && !(mat.transparent && mat.opacity < 0.05)) list.push(m);
    });
    glow.set(id, list);
  }

  const beacons = new Map<AreaId, THREE.Mesh>();
  const beaconGeom = new THREE.SphereGeometry(0.11, 16, 12);
  const beaconAt = (id: AreaId, p: V3) => {
    const bm = new THREE.Mesh(beaconGeom, new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.92, depthTest: false }));
    bm.position.set(...p);
    bm.renderOrder = 10;
    bm.userData.area = id;
    bm.userData.beacon = true;
    root.add(bm);
    beacons.set(id, bm);
    picks.push(bm);
  };
  const pos = (id: AreaId) => areas.get(id)!.position;
  const at = (id: AreaId, dx: number, y: number, dz: number): V3 => [pos(id).x + dx, y, pos(id).z + dz];
  beaconAt('bed', at('bed', 1.2, 0.95, 0.6));
  beaconAt('kitchen', at('kitchen', 0.9, 1.35, 0.4));
  beaconAt('tunnel', at('tunnel', -1.0, 1.15, 0.4));
  beaconAt('sisters', at('sisters', 0.4, 2.3, 0.4));
  beaconAt('compost', at('compost', -0.9, 1.25, 0.4));
  beaconAt('tools', at('tools', -0.6, 1.75, 0.2));
  beaconAt('pantry', at('pantry', 0.7, 2.6, 0.9));
  beaconAt('water', at('water', 0.0, 1.45, 0.2));
  beaconAt('hydro', at('hydro', 0.5, 2.5, 0.2));
  beaconAt('herbs', at('herbs', 0.2, 1.4, 0.2));
  beaconAt('fruit', at('fruit', -0.2, 3.4, -0.9));
  beaconAt('pollinators', at('pollinators', -0.5, 2.45, -0.4));
  beaconAt('seedlings', at('seedlings', 0.0, 1.65, 0.0));
  beaconAt('arbor', at('arbor', -0.95, 2.55, 0.0));

  const view = (target: V3, dir: V3, dist: number): View => {
    const t = V(...target);
    const p = t.clone().addScaledVector(V(...dir).normalize(), dist);
    return { target: [t.x * K, t.y * K, t.z * K], pos: [p.x * K, p.y * K, p.z * K] };
  };
  const views: Record<AreaId, View> = {
    bed: view(at('bed', 0.65, 0.4, 0.3), [0.3, 0.55, 1], 3.9),
    kitchen: view(at('kitchen', 0, 0.75, 0), [0.25, 0.6, 1], 3.6),
    tunnel: view(at('tunnel', 0, 0.5, 0), [-0.3, 0.75, 1], 3.6),
    sisters: view(at('sisters', 0, 1.0, 0), [0.4, 0.45, 1], 5.2),
    compost: view(at('compost', 0, 0.5, 0), [-0.65, 0.75, 1], 3.8),
    tools: view(at('tools', 0, 0.9, 0), [0, 0.3, 1], 3.6),
    pantry: view(at('pantry', 0, 1.1, 0.4), [-0.2, 0.4, 1], 4.4),
    water: view(at('water', -0.1, 0.55, 0.4), [0.25, 0.8, 1], 3.5),
    hydro: view(at('hydro', 0, 1.1, 0), [0.2, 0.35, 1], 3.8),
    herbs: view(at('herbs', 0.1, 0.6, 0), [0.6, 0.7, 1], 3.6),
    fruit: view(at('fruit', -0.2, 1.4, -0.2), [-0.7, 0.35, 1], 5.6),
    pollinators: view(at('pollinators', -0.1, 1.0, 0), [-0.35, 0.3, 1], 4.4),
    seedlings: view(at('seedlings', 0, 1.0, 0), [1, 0.5, 0.25], 2.6),
    arbor: view(at('arbor', 0, 1.3, 0), [0.25, 0.25, 1], 4.4),
  };
  const overview: View = view([0, 0.2, 0.2], [0.16, 0.72, 1], 15.5);

  // ---------- behaviour ----------
  const lids = new Map<LidId, { open: boolean; k: number }>();
  let gustUntil = 0;
  let clock = 0;
  const drops: THREE.Mesh[] = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff });
  let swingStart = -10;
  let swarmStart = -10;

  return {
    key: rigKey(s),
    group: (() => {
      const g = new THREE.Group();
      g.add(root);
      return g;
    })(),
    picks,
    glow,
    beacons,
    views,
    overview,
    setLid(lid, open) {
      const st = lids.get(lid) ?? { open: false, k: 0 };
      lids.set(lid, st);
      if (st.open === open) return;
      st.open = open;
      const k0 = st.k;
      tween({
        duration: 900,
        ease: easeInOutCubic,
        tag: `glid-${lid}`,
        update: (t) => {
          st.k = lerp(k0, open ? 1 : 0, t);
          lidHooks[lid]?.(st.k);
        },
      });
    },
    poke(id) {
      if (id === 'water' || id === 'hydro') {
        for (let i = 0; i < 6; i++) {
          const d = new THREE.Mesh(LOW_SPHERE, dropMat);
          d.scale.setScalar(0.018);
          d.userData.born = clock + i * 0.12;
          d.userData.from = id === 'water' ? spigot.clone() : V(pos('hydro').x + jitter(r, 0.3), 1.3, pos('hydro').z + 0.1);
          d.visible = false;
          root.add(d);
          drops.push(d);
        }
      } else if (id === 'tools') swingStart = clock;
      else if (id === 'pollinators' || id === 'fruit' || id === 'herbs' || id === 'arbor') swarmStart = clock;
      if (id !== 'pantry' && id !== 'water') gustUntil = clock + 1.8;
    },
    update(t) {
      const dt = Math.min(0.05, t - clock);
      clock = t;
      shared.uTime.value = t;
      // Gusts ease in and out.
      const target = t < gustUntil ? 3.2 : 1;
      shared.uGust.value += (target - shared.uGust.value) * Math.min(1, dt * 3);
      // Bees and butterflies.
      const swarm = Math.max(0, 1 - (t - swarmStart) / 4);
      for (const c of bugs) {
        const a = t * c.speed + c.phase;
        const rad = c.rad * (1 - 0.5 * swarm);
        const x = Math.cos(a) * rad + Math.sin(a * 2.3) * 0.12;
        const z = Math.sin(a * 1.1) * rad;
        const y = Math.sin(a * 1.7) * 0.15 + (c.bee ? 0 : 0.2);
        c.g.position.set(c.home.x + x, c.home.y + y, c.home.z + z);
        const vx = -Math.sin(a) * rad;
        const vz = Math.cos(a * 1.1) * rad * 1.1;
        c.g.rotation.y = Math.atan2(-vz, vx);
        const flap = c.bee ? Math.sin(t * 60) * 0.6 : Math.sin(t * 9 + c.phase) * 1.0;
        for (const w of c.wings) w.rotation.x = w.userData.side * (c.bee ? 0.3 + flap : flap);
      }
      // Steam from the hot pile.
      for (const p of steam) {
        const k2 = (t * 0.25 + p.userData.phase) % 1;
        p.position.set(steamBase.x + Math.sin(k2 * 6 + p.userData.phase * 9) * 0.08, 0.62 + k2 * 0.7, -0.02);
        p.scale.setScalar(0.05 + k2 * 0.12);
        (p.material as THREE.MeshBasicMaterial).opacity = 0.4 * Math.sin(k2 * Math.PI);
      }
      // Tools sway when poked.
      const sw = t - swingStart;
      toolSwing.forEach((g, i) => (g.rotation.z = sw < 3 ? Math.sin(sw * 6 + i) * 0.12 * (1 - sw / 3) : 0));
      // Water drops.
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const age = t - d.userData.born;
        if (age < 0) continue;
        d.visible = true;
        const from = d.userData.from as THREE.Vector3;
        d.position.set(from.x, from.y - 4.9 * age * age, from.z);
        if (d.position.y < 0.02) {
          root.remove(d);
          drops.splice(i, 1);
        }
      }
    },
    dispose() {
      disposeTree(root);
    },
  };
}
