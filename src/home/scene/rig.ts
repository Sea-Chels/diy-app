/**
 * The comic cutaway house: one open room with the front and right walls
 * removed, like a dollhouse. A kitchen runs along the back wall, a small
 * bathroom sits behind half-height walls in the back-left corner, and the
 * left wall carries the breaker panel, an outlet, a hole in the drywall and
 * the front door. Modelled in metres and scaled down; the contract with the
 * scene is `Rig`. Every AreaId in data/areas.ts gets a pick proxy, a beacon
 * and a view.
 */
import * as THREE from 'three';
import type { AreaId, LidId } from '../data/areas';
import { WALL_HEX, type Setup } from '../data/setup';
import { tween, easeInOutCubic, lerp } from '../../shared/tween';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { disposeTree, glass, INK, lineMaterials, shared, toon } from '../../shared/toon';
import { add, box, canvasTex, label, leafGeo, leafMatrix, mapped, range, rng, speckle, tube, woodTexture, type V3 } from '../../garden/scene/kit';

export interface View {
  pos: V3;
  target: V3;
}

export interface Rig {
  key: string;
  group: THREE.Group;
  /** Invisible boxes the pointer is tested against, plus the outer walls (userData.blocker) that hide picks behind them. */
  picks: THREE.Mesh[];
  /** Meshes outlined when an area is hovered or selected. */
  glow: Map<AreaId, THREE.Mesh[]>;
  beacons: Map<AreaId, THREE.Mesh>;
  views: Record<AreaId, View>;
  overview: View;
  setLid(lid: LidId, open: boolean): void;
  poke(area: AreaId): void;
  update(t: number): void;
  dispose(): void;
}

export const rigKey = (s: Setup) => `${s.counter}|${s.ceiling}|${s.floor}|${s.wall}`;

/** Metres to scene units. */
export const K = 0.6;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// Room extents. The back wall's inner face is at z = Z0, the left wall's at x = X0.
const X0 = -3.5;
const X1 = 3.5;
const Z0 = -2.75;
const Z1 = 2.75;
const T = 0.14; // exterior wall thickness
const WH = 2.6; // wall height (the cut)
const PH = 1.2; // bathroom partitions are cut lower so you can see in
// The bathroom is x in [X0, BX], z in [Z0, BZ]; its partitions sit just outside that.
const BX = -1.9;
const BZ = -0.45;
const PT = 0.12; // partition thickness

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

// ---------- textures ----------

/** Wall cross-section: drywall, stud, sheathing, siding (or drywall both sides for partitions). */
function sectionTex(layers: [string, number][], vertical: boolean): THREE.CanvasTexture {
  return canvasTex(64, 64, (ctx) => {
    let at = 0;
    for (const [col, frac] of layers) {
      ctx.fillStyle = col;
      const n = frac * 64;
      if (vertical) ctx.fillRect(at, 0, n + 1, 64);
      else ctx.fillRect(0, at, 64, n + 1);
      at += n;
    }
  });
}
const EXT_LAYERS: [string, number][] = [['#f4efe4', 0.1], ['#d9b07a', 0.62], ['#b48a52', 0.1], ['#7d93a6', 0.18]];
const INT_LAYERS: [string, number][] = [['#f4efe4', 0.14], ['#d9b07a', 0.72], ['#f4efe4', 0.14]];

function subway(repeat: [number, number], base = '#f6f4ee', grout = '#c9c4b8'): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 8; row++) {
      for (let c = -1; c < 3; c++) {
        ctx.fillStyle = base;
        ctx.fillRect(c * 64 + (row % 2) * 32 + 1.5, row * 16 + 1.5, 61, 13);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(c * 64 + (row % 2) * 32 + 4, row * 16 + 3, 20, 2);
      }
    }
  }, repeat);
}

function hexTile(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#9b978f';
    ctx.fillRect(0, 0, 128, 128);
    const r = 128 / 6 / Math.sqrt(3);
    const w = Math.sqrt(3) * r;
    for (let row = -1; row < 8; row++) {
      for (let c = -1; c < 8; c++) {
        const cx = c * w + (row % 2 ? w / 2 : 0);
        const cy = row * r * 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (i * Math.PI) / 3;
          ctx.lineTo(cx + Math.cos(a) * (r - 1.4), cy + Math.sin(a) * (r - 1.4));
        }
        ctx.closePath();
        ctx.fillStyle = (row * 7 + c * 3) % 11 === 0 ? '#2d3340' : '#f2f0ea';
        ctx.fill();
      }
    }
  }, repeat);
}

/** Floor boards: rows `rows` boards tall on a 256 canvas, staggered joints. */
function boards(base: string[], seam: string, rows: number, repeat: [number, number], seed: number): THREE.CanvasTexture {
  return canvasTex(256, 256, (ctx) => {
    const r = rng(seed);
    const h = 256 / rows;
    for (let row = 0; row < rows; row++) {
      let x = -r() * 200;
      while (x < 256) {
        const len = range(r, 120, 240);
        ctx.fillStyle = base[Math.floor(r() * base.length)];
        ctx.fillRect(x, row * h, len, h);
        ctx.strokeStyle = 'rgba(60,35,15,0.18)';
        for (let g = 0; g < 3; g++) {
          const y = row * h + range(r, 2, h - 2);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + len * 0.3, y + range(r, -2, 2), x + len * 0.7, y + range(r, -2, 2), x + len, y);
          ctx.stroke();
        }
        ctx.fillStyle = seam;
        ctx.fillRect(x, row * h, 1.5, h);
        x += len;
      }
      ctx.fillStyle = seam;
      ctx.fillRect(0, row * h, 256, 1.5);
    }
  }, repeat);
}

function bigTile(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#8d8a84';
    ctx.fillRect(0, 0, 128, 128);
    const r = rng(5);
    for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) {
      ctx.fillStyle = ['#cfcac0', '#c6c0b4', '#d6d1c7'][Math.floor(r() * 3)];
      ctx.fillRect(x + 1.5, y + 1.5, 61, 61);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(120,110,100,0.25)';
        ctx.fillRect(x + 2 + r() * 58, y + 2 + r() * 58, 2, 2);
      }
    }
  }, repeat);
}

/** Lap siding, 8 boards per 1.2 m, offset so boards line up across separate wall pieces. */
function lapSiding(y0: number, y1: number): THREE.CanvasTexture {
  const t = canvasTex(64, 64, (ctx) => {
    for (let i = 0; i < 8; i++) {
      const y = i * 8;
      ctx.fillStyle = '#7d93a6'; ctx.fillRect(0, y, 64, 8);
      ctx.fillStyle = '#93a8ba'; ctx.fillRect(0, y, 64, 1.5);
      ctx.fillStyle = '#4e6273'; ctx.fillRect(0, y + 6.5, 64, 1.5);
    }
  }, [2, (y1 - y0) / 1.2]);
  t.offset.y = y0 / 1.2;
  return t;
}

export function buildRig(s: Setup): Rig {
  const r = rng(77);
  const lidHooks: Partial<Record<LidId, (k: number) => void>> = {};
  const root = new THREE.Group();
  root.scale.setScalar(K);

  const M = {
    paint: toon(WALL_HEX[s.wall]),
    bathPaint: toon(0xcfe4e0),
    cut: toon(0xf4efe4),
    concrete: mapped(0xffffff, speckle('#a7a39b', ['#8e8a82', '#bdb9b0'], 300, [1, 3], [3, 1], 44)),
    gutter: toon(0xf1efe9, { shine: 0.5 }),
    secExtV: mapped(0xffffff, sectionTex(EXT_LAYERS, false)),
    secExtU: mapped(0xffffff, sectionTex(EXT_LAYERS, true)),
    secIntV: mapped(0xffffff, sectionTex(INT_LAYERS, false)),
    secIntU: mapped(0xffffff, sectionTex(INT_LAYERS, true)),
    dark: toon(0x23262e),
    trim: toon(0xf6f3ec),
    cab: toon(0x2f4a6b),
    cabIn: toon(0x1a2230),
    brass: toon(0xd8b04a, { shine: 0.8, metal: 0.6 }),
    steel: toon(0xc3c9d1, { shine: 0.8, metal: 0.7 }),
    chrome: toon(0xd9dee6, { shine: 0.9, metal: 0.8 }),
    black: toon(0x1d1f24, { shine: 0.5 }),
    porcelain: toon(0xf7f7f4, { shine: 0.6 }),
    pvc: toon(0xf2f2ee, { shine: 0.4 }),
    copper: toon(0xc77a45, { shine: 0.7, metal: 0.6 }),
    braided: toon(0xaab1ba, { shine: 0.5, metal: 0.4 }),
    plate: toon(0xf3f0e8, { shine: 0.3 }),
    red: toon(0xd8432f),
    door: toon(0xb5452e),
    oak: mapped(0xffffff, woodTexture('#c8955c', '#9a6a3a', [1, 1])),
    walnut: mapped(0xffffff, woodTexture('#7a5236', '#553620', [1, 1])),
    water: new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.5 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffe6a8 }),
    subwayKitchen: mapped(0xffffff, subway([4, 1])),
    wire: { black: toon(0x202020), white: toon(0xf1f1f1), bare: toon(0xc77a45, { shine: 0.7, metal: 0.6 }), green: toon(0x2e9a4c) },
  };

  // ---------- area bookkeeping ----------
  const areas = new Map<AreaId, THREE.Group>();
  const picks: THREE.Mesh[] = [];
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const siding = (y0: number, y1: number) => mapped(0xffffff, lapSiding(y0, y1), { halftone: 0.5 });
  /** Outer walls: picks behind them don't count. */
  const blocker = (m: THREE.Mesh) => {
    m.userData.blocker = true;
    // Walls are built in pieces round the window and door; their outline is drawn once, below.
    m.userData.noCrease = true;
    picks.push(m);
    return m;
  };
  function area(id: AreaId): THREE.Group {
    const g = new THREE.Group();
    g.userData.area = id;
    root.add(g);
    areas.set(id, g);
    return g;
  }
  function pick(g: THREE.Group, min: V3, max: V3): void {
    const m = new THREE.Mesh(UNIT_BOX, pickMat);
    m.scale.set(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    m.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    m.userData.area = g.userData.area;
    g.add(m);
    picks.push(m);
  }
  /** Axis-aligned box from corner to corner, one material per face (+x, -x, +y, -y, +z, -z). */
  function slab(min: V3, max: V3, mat: THREE.Material | THREE.Material[], parent: THREE.Object3D = root, ink: 'thin' | 'body' | null = 'body'): THREE.Mesh {
    const g = new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    return add(g, mat as THREE.Material, parent, [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], { ink });
  }
  /** A pivot group, so lids can swing or slide around a hinge. */
  function pivot(parent: THREE.Object3D, p: V3): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...p);
    parent.add(g);
    return g;
  }

  // ---------- floor slab, cut to show the layers ----------
  const floorFront = mapped(0xffffff, canvasTex(256, 64, (ctx) => {
    // Front cut: finish floor, underlayment, subfloor, joist ends every 16 in, drywall ceiling below.
    ctx.fillStyle = '#2a2420';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#c8955c'; ctx.fillRect(0, 0, 256, 4);
    ctx.fillStyle = '#5b6f8a'; ctx.fillRect(0, 4, 256, 2);
    ctx.fillStyle = '#b8935c'; ctx.fillRect(0, 6, 256, 6);
    ctx.fillStyle = '#e9b9c8'; ctx.fillRect(0, 12, 256, 46);
    for (let x = 0; x < 256; x += 36) {
      ctx.fillStyle = '#d9b07a'; ctx.fillRect(x, 12, 9, 46);
      ctx.fillStyle = '#b8935c'; ctx.fillRect(x + 1, 13, 1, 44);
    }
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 58, 256, 6);
  }, [2, 1]));
  const floorSide = mapped(0xffffff, canvasTex(256, 64, (ctx) => {
    // Side cut runs along a joist.
    ctx.fillStyle = '#c8955c'; ctx.fillRect(0, 0, 256, 4);
    ctx.fillStyle = '#5b6f8a'; ctx.fillRect(0, 4, 256, 2);
    ctx.fillStyle = '#b8935c'; ctx.fillRect(0, 6, 256, 6);
    ctx.fillStyle = '#d9b07a'; ctx.fillRect(0, 12, 256, 46);
    ctx.strokeStyle = 'rgba(120,80,40,0.4)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, 16 + i * 7); ctx.bezierCurveTo(80, 18 + i * 7, 170, 14 + i * 7, 256, 16 + i * 7); ctx.stroke();
    }
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 58, 256, 6);
  }, [3, 1]));
  slab([X0 - T, -0.34, Z0 - T], [X1, 0, Z1], [floorSide, M.concrete, M.dark, M.dark, floorFront, M.concrete]);

  // Finish floor with a hole at the front where planks lift out (the floor area).
  const HOLE = { x0: 0.2, x1: 1.4, z0: 2.1, z1: 2.55 };
  const FLOOR_TEX = {
    oak: () => boards(['#c8955c', '#bd8a52', '#d1a06a', '#b98050'], '#6b4526', 12, [1 / 1.6, 1 / 1.0], 3),
    lvp: () => boards(['#a99a86', '#9d8f7c', '#b3a591', '#958774'], '#5f5547', 6, [1 / 1.9, 1 / 1.1], 9),
    tile: () => bigTile([1 / 1.2, 1 / 1.2]),
  }[s.floor];
  const floorMat = mapped(0xffffff, FLOOR_TEX(), { halftone: 0.6 });
  {
    const sh = new THREE.Shape();
    // Shape y is world -z. L-shape around the bathroom.
    const pts: [number, number][] = [[BX + PT, Z0], [X1, Z0], [X1, Z1], [X0, Z1], [X0, BZ + PT], [BX + PT, BZ + PT]];
    pts.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
    const hole = new THREE.Path();
    hole.moveTo(HOLE.x0, -HOLE.z0); hole.lineTo(HOLE.x0, -HOLE.z1); hole.lineTo(HOLE.x1, -HOLE.z1); hole.lineTo(HOLE.x1, -HOLE.z0);
    sh.holes.push(hole);
    const g = new THREE.ShapeGeometry(sh);
    g.rotateX(-Math.PI / 2);
    const f = add(g, floorMat, root, [0, 0.002, 0], { ink: null });
    f.castShadow = false;
    f.userData.crease = true;
  }
  // Bathroom floor: hex tile.
  {
    const g = new THREE.PlaneGeometry(BX - X0, BZ - Z0);
    g.rotateX(-Math.PI / 2);
    const f = add(g, mapped(0xffffff, hexTile([4, 6]), { halftone: 0.5 }), root, [(X0 + BX) / 2, 0.003, (Z0 + BZ) / 2], { ink: null });
    f.castShadow = false;
  }

  // ---------- walls ----------
  // Back wall: interior face +z. Faces: +x, -x, +y, -y, +z, -z.
  const backWall = (x0: number, x1: number, y0: number, y1: number, paint: THREE.Material, endCut = false) =>
    blocker(slab([x0, y0, Z0 - T], [x1, y1, Z0], [endCut ? M.secExtU : M.cut, M.cut, M.secExtV, M.dark, paint, siding(y0, y1)], root, null));
  // Left wall: interior face +x.
  const leftWall = (z0: number, z1: number, y0: number, y1: number, paint: THREE.Material, endCut = false) =>
    blocker(slab([X0 - T, y0, z0], [X0, y1, z1], [paint, siding(y0, y1), M.secExtU, M.dark, endCut ? M.secExtU : M.cut, M.cut], root, null));

  const WIN = { x0: -0.65, x1: 0.35, y0: 1.1, y1: 2.1 };
  const DOOR = { z0: 1.55, z1: 2.47, y1: 2.1 };
  backWall(X0 - T, BX + PT / 2, 0, WH, M.bathPaint);
  backWall(BX + PT / 2, WIN.x0, 0, WH, M.paint);
  backWall(WIN.x0, WIN.x1, 0, WIN.y0, M.paint);
  backWall(WIN.x0, WIN.x1, WIN.y1, WH, M.paint);
  backWall(WIN.x1, X1, 0, WH, M.paint, true);
  leftWall(Z0, BZ + PT / 2, 0, WH, M.bathPaint);
  leftWall(BZ + PT / 2, DOOR.z0, 0, WH, M.paint);
  leftWall(DOOR.z0, DOOR.z1, DOOR.y1, WH, M.paint);
  leftWall(DOOR.z1, Z1, 0, WH, M.paint, true);
  // Bathroom partitions, cut at PH. Kitchen side painted, bathroom side pale aqua.
  slab([BX, 0, Z0], [BX + PT, PH, BZ + PT], [M.paint, M.bathPaint, M.secIntU, M.dark, M.secIntU, M.cut]);
  slab([X0, 0, BZ], [-2.75, PH, BZ + PT], [M.secIntU, M.cut, M.secIntV, M.dark, M.paint, M.bathPaint]);
  // Baseboards.
  const base = (min: V3, max: V3) => slab(min, max, M.trim, root, 'thin');
  base([BX + PT, 0, Z0], [X1, 0.09, Z0 + 0.015]);
  base([X0, 0, BZ + PT], [X0 + 0.015, 0.09, DOOR.z0 - 0.07]);
  base([X0, 0, DOOR.z1 + 0.07], [X0 + 0.015, 0.09, Z1]);
  base([X0, 0, BZ + PT], [-2.75, 0.09, BZ + PT + 0.015]);

  // ---------- shared fixtures ----------
  /** Shaker cabinet door or drawer front centred on `p`, facing +z (or +x when `side`). */
  function shaker(parent: THREE.Object3D, w: number, h: number, p: V3, mat: THREE.Material = M.cab, side = false, pull: 'bar' | 'knob' | null = 'bar', pullAt: 'top' | 'side' | 'side-r' = 'side'): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...p);
    if (side) g.rotation.y = Math.PI / 2;
    parent.add(g);
    box(w - 0.004, h - 0.004, 0.02, mat, g, [0, 0, 0], { r: 0.004 });
    const st = Math.min(0.055, w * 0.18, h * 0.18);
    for (const sx of [-1, 1]) box(st, h - 0.004, 0.008, mat, g, [sx * (w / 2 - st / 2 - 0.002), 0, 0.012], { r: 0.002, ink: 'thin' });
    for (const sy of [-1, 1]) box(w - 2 * st, st, 0.008, mat, g, [0, sy * (h / 2 - st / 2 - 0.002), 0.012], { r: 0.002, ink: 'thin' });
    if (pull === 'bar') {
      const px = pullAt === 'top' ? 0 : pullAt === 'side' ? w / 2 - st / 2 : -(w / 2 - st / 2);
      const py = pullAt === 'top' ? h / 2 - st / 2 : 0;
      const len = Math.min(0.12, pullAt === 'top' ? w * 0.4 : h * 0.4);
      box(pullAt === 'top' ? len : 0.012, pullAt === 'top' ? 0.012 : len, 0.012, M.brass, g, [px, py, 0.03], { r: 0.005, ink: 'thin' });
    } else if (pull === 'knob') {
      add(new THREE.SphereGeometry(0.018, 10, 8), M.brass, g, [0, 0, 0.032], { ink: 'thin' });
    }
    return g;
  }
  /** Wall plate with a duplex outlet, GFCI or toggle switch, facing `face`. */
  function plateWith(parent: THREE.Object3D, kind: 'duplex' | 'gfci' | 'switch', p: V3, face: '+x' | '+z'): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...p);
    if (face === '+x') g.rotation.y = Math.PI / 2;
    parent.add(g);
    box(0.072, 0.118, 0.008, M.plate, g, [0, 0, 0.004], { r: 0.003, ink: 'thin' });
    const dev = new THREE.Group();
    dev.position.z = 0.008;
    g.add(dev);
    if (kind === 'duplex') {
      for (const y of [-0.022, 0.022]) {
        box(0.036, 0.034, 0.006, M.plate, dev, [0, y, 0.002], { r: 0.008, ink: 'thin' });
        for (const x of [-0.007, 0.007]) slab([x - 0.0015, y + 0.002, 0.004], [x + 0.0015, y + 0.012, 0.0055], M.black, dev, null);
        slab([-0.003, y - 0.012, 0.004], [0.003, y - 0.006, 0.0055], M.black, dev, null);
      }
    } else if (kind === 'gfci') {
      box(0.04, 0.09, 0.007, M.plate, dev, [0, 0, 0.002], { r: 0.004, ink: 'thin' });
      box(0.024, 0.01, 0.004, M.black, dev, [0, 0.004, 0.006], { r: 0.002, ink: null });
      box(0.012, 0.01, 0.004, M.red, dev, [0, -0.008, 0.006], { r: 0.002, ink: null });
    } else {
      box(0.012, 0.026, 0.02, M.plate, dev, [0, 0.004, 0.008], { rot: [-0.35, 0, 0], r: 0.004, ink: 'thin' });
    }
    g.userData.device = dev;
    return g;
  }

  // ---------- kitchen ----------
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
  // Upper cabinets.
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
    // Garbage disposal.
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
    // Interior casing, stool and apron.
    jamb([WIN.x0 - 0.07, WIN.y0 - 0.02, Z0], [WIN.x0, WIN.y1 + 0.07, Z0 + 0.018]);
    jamb([WIN.x1, WIN.y0 - 0.02, Z0], [WIN.x1 + 0.07, WIN.y1 + 0.07, Z0 + 0.018]);
    jamb([WIN.x0 - 0.07, WIN.y1, Z0], [WIN.x1 + 0.07, WIN.y1 + 0.07, Z0 + 0.018]);
    jamb([WIN.x0 - 0.1, WIN.y0 - 0.025, Z0 - 0.03], [WIN.x1 + 0.1, WIN.y0, Z0 + 0.06]);
    jamb([WIN.x0 - 0.05, 1.02, Z0], [WIN.x1 + 0.05, WIN.y0 - 0.025, Z0 + 0.015]);
    // Exterior sill.
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

  // Range and hood.
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
    // Chimney hood.
    const hood = new THREE.CylinderGeometry(0.34, 1, 0.16, 4, 1);
    hood.rotateY(Math.PI / 4);
    add(hood, M.steel, a, [cx, 1.68, Z0 + 0.26], { scale: [0.537, 1, 0.354] });
    box(0.78, 0.03, 0.52, M.steel, a, [cx, 1.585, Z0 + 0.26], { r: 0.006 });
    box(0.26, 0.86, 0.2, M.steel, a, [cx, 2.17, Z0 + 0.12], { r: 0.006 });
  }
  // Dishwasher.
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

  // ---------- bathroom ----------
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
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 16), M.chrome, b, [X0 + 0.3, 0.103, Z0 + TD / 2], { ink: 'thin' });
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 16), M.chrome, b, [X0 + 0.104, 0.36, Z0 + TD / 2], { rot: [0, 0, Math.PI / 2], ink: 'thin' });
    // Tile surround on three sides.
    const tileM = (w: number, h: number) => mapped(0xffffff, subway([w / 0.3, h / 0.6], '#ffffff', '#b9c4c6'));
    slab([X0, 0.5, Z0], [BX, 1.85, Z0 + 0.008], tileM(BX - X0, 1.35), b, 'thin');
    slab([X0, 0.5, Z0], [X0 + 0.008, 1.85, Z0 + TD], tileM(TD, 1.35), b, 'thin');
    slab([BX - 0.008, 0.5, Z0], [BX, PH, Z0 + TD], tileM(TD, PH - 0.5), b, 'thin');
    // Spout, valve and showerhead on the end wall.
    const zc = Z0 + TD / 2;
    tube([V(X0 + 0.008, 0.66, zc), V(X0 + 0.1, 0.66, zc), V(X0 + 0.14, 0.62, zc)], 0.018, M.chrome, b, { seg: 12, radial: 10 });
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24), M.chrome, b, [X0 + 0.014, 1.0, zc], { rot: [0, 0, Math.PI / 2] });
    tube([V(X0 + 0.02, 1.0, zc), V(X0 + 0.07, 1.0, zc), V(X0 + 0.08, 1.0, zc + 0.08)], 0.01, M.chrome, b, { seg: 8 });
    tube([V(X0 + 0.008, 1.85, zc), V(X0 + 0.14, 1.88, zc), V(X0 + 0.2, 1.84, zc)], 0.011, M.chrome, b, { seg: 12 });
    add(new THREE.CylinderGeometry(0.07, 0.04, 0.05, 20), M.chrome, b, [X0 + 0.22, 1.82, zc], { rot: [0, 0, 0.5] });
    // The caulk bead where the tub meets the tile, going mouldy in spots.
    tube([V(X0, 0.505, Z0 + 0.012), V(BX, 0.505, Z0 + 0.012)], 0.007, M.porcelain, b, { seg: 4, ink: null });
    tube([V(X0 + 0.012, 0.505, Z0), V(X0 + 0.012, 0.505, Z0 + TD)], 0.007, M.porcelain, b, { seg: 4, ink: null });
    const mould = toon(0x4a4f3a);
    for (let i = 0; i < 9; i++) add(new THREE.SphereGeometry(0.008, 6, 4), mould, b, [range(r, X0 + 0.1, BX - 0.1), 0.508, Z0 + 0.016], { ink: null });
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
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16), toon(0xdcdcd4), t, [fx, 0.43, TZ - 0.02]);
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 10), toon(0xdcdcd4), t, [fx - 0.05, 0.54, TZ - 0.02]);
    flapper.position.set(fx - 0.04, 0.445, TZ - 0.02);
    t.add(flapper);
    add(new THREE.CylinderGeometry(0.04, 0.036, 0.016, 18), M.red, flapper, [0.04, 0, 0], { ink: 'thin' });
    // Handle and the lever arm inside, with the chain down to the flapper.
    const hz = TZ - 0.19;
    box(0.02, 0.025, 0.05, M.chrome, t, [tx1 + 0.012, 0.72, hz], { r: 0.008 });
    handleArm.position.set(tx1 - 0.02, 0.72, hz);
    t.add(handleArm);
    slab([-0.005, -0.004, 0], [0.005, 0.004, 0.16], M.chrome, handleArm, 'thin');
    tube([V(fx + 0.02, 0.455, TZ - 0.02), V(fx + 0.0, 0.6, TZ - 0.03), V(tx1 - 0.02, 0.715, hz + 0.15)], 0.0025, M.chrome, t, { seg: 12, ink: null });
    // Fill valve with a float cup and the refill tube into the overflow.
    const vz = TZ + 0.14;
    add(new THREE.CylinderGeometry(0.016, 0.02, 0.27, 12), toon(0x7d8590), t, [fx - 0.02, 0.555, vz]);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 14), toon(0x2c2f36), t, [fx - 0.02, 0.6, vz]);
    add(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), toon(0x7d8590), t, [fx - 0.02, 0.7, vz]);
    tube([V(fx - 0.02, 0.71, vz - 0.02), V(fx - 0.04, 0.74, TZ + 0.06), V(fx - 0.05, 0.68, TZ - 0.02)], 0.004, M.black, t, { seg: 14, ink: null });
    // Lid, lifted when the toilet is open.
    const lid = box(tx1 - tx0 + 0.02, 0.026, tz1 - tz0 + 0.02, M.porcelain, t, [(tx0 + tx1) / 2, 0.793, TZ], { r: 0.008 });
    // Bowl: a lathed shape stretched front to back.
    const prof = [[0.1, 0], [0.115, 0.04], [0.1, 0.14], [0.15, 0.27], [0.19, 0.37], [0.19, 0.4], [0.155, 0.4], [0.14, 0.36], [0.06, 0.25], [0, 0.24]].map(([a, b]) => new THREE.Vector2(a, b));
    const bowl = add(new THREE.LatheGeometry(prof, 28), M.porcelain, t, [X0 + 0.47, 0, TZ], { scale: [1.3, 1, 1] });
    bowl.userData.bowl = true;
    add(new THREE.CircleGeometry(0.1, 20), M.water, t, [X0 + 0.48, 0.3, TZ], { rot: [-Math.PI / 2, 0, 0], scale: [1.3, 1, 1], ink: null });
    add(new THREE.TorusGeometry(0.155, 0.024, 8, 28), M.porcelain, t, [X0 + 0.47, 0.41, TZ], { rot: [Math.PI / 2, 0, 0], scale: [1.3, 1, 0.45] });
    const seatLid = add(new THREE.CylinderGeometry(1, 1, 0.022, 28), M.porcelain, t, [X0 + 0.27, 0.6, TZ], { rot: [0, 0, Math.PI / 2 + 0.14], scale: [0.2, 1, 0.17] });
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
    for (const sd of [-1, 1]) add(new THREE.SphereGeometry(0.018, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.porcelain, t, [X0 + 0.5, 0.02, TZ + sd * 0.12], { ink: 'thin' });
    // Shut-off valve and supply line.
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 10), M.chrome, t, [X0 + 0.025, 0.17, TZ + 0.14], { rot: [0, 0, Math.PI / 2] });
    box(0.02, 0.012, 0.045, toon(0xd8d8d8, { shine: 0.6 }), t, [X0 + 0.06, 0.17, TZ + 0.14], { r: 0.005 });
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
    // Top with an oval bowl.
    const sh = new THREE.Shape();
    [[X0, z0 - 0.02], [X0 + d + 0.025, z0 - 0.02], [X0 + d + 0.025, z1 + 0.02], [X0, z1 + 0.02]].forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
    const hole = new THREE.Path();
    hole.absellipse(X0 + 0.3, -zc, 0.15, 0.12, 0, Math.PI * 2, true, 0);
    sh.holes.push(hole);
    const top = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false, curveSegments: 24 });
    top.rotateX(-Math.PI / 2);
    add(top, M.porcelain, b, [0, 0.82, 0]);
    add(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.porcelain, b, [X0 + 0.3, 0.852, zc], { scale: [0.152, 0.1, 0.122], ink: 'thin' });
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 12), M.chrome, b, [X0 + 0.3, 0.755, zc], { ink: null });
    tube([V(X0 + 0.05, 0.855, zc), V(X0 + 0.06, 0.95, zc), V(X0 + 0.14, 0.95, zc), V(X0 + 0.16, 0.92, zc)], 0.012, M.chrome, b, { seg: 16, radial: 10 });
    for (const sd of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.016, 0.02, 0.04, 12), M.chrome, b, [X0 + 0.06, 0.875, zc + sd * 0.1]);
      box(0.012, 0.012, 0.05, M.chrome, b, [X0 + 0.06, 0.9, zc + sd * 0.1], { r: 0.005, ink: 'thin' });
    }
    add(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6), M.chrome, b, [X0 + 0.03, 0.88, zc]);
    // Tailpiece, pop-up pivot rod and P-trap into the wall.
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10), M.chrome, b, [X0 + 0.3, 0.64, zc]);
    add(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), M.chrome, b, [X0 + 0.24, 0.68, zc], { rot: [0, 0, Math.PI / 2] });
    tube([V(X0 + 0.3, 0.54, zc), V(X0 + 0.3, 0.44, zc), V(X0 + 0.25, 0.4, zc), V(X0 + 0.2, 0.45, zc), V(X0 + 0.12, 0.48, zc), V(X0 + 0.01, 0.48, zc)], 0.018, M.chrome, b, { seg: 30, radial: 10 });
    for (const sd of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 10), M.chrome, b, [X0 + 0.035, 0.3, zc + sd * 0.15], { rot: [0, 0, Math.PI / 2] });
      box(0.02, 0.012, 0.04, toon(sd < 0 ? 0xd8432f : 0x3b82f6), b, [X0 + 0.07, 0.3, zc + sd * 0.15], { r: 0.005 });
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
    // Mirror.
    slab([X0, 1.02, z0 + 0.02], [X0 + 0.03, 1.66, z1 - 0.02], M.walnut, b, 'thin');
    slab([X0 + 0.03, 1.05, z0 + 0.05], [X0 + 0.034, 1.63, z1 - 0.05], toon(0xcfe3ee, { shine: 1 }), b, null);
    pick(b, [X0, 0, z0 - 0.03], [X0 + 0.58, 1.7, z1 + 0.03]);
  }

  // ---------- left wall: shut-offs, outlets, a hole, the front door ----------
  const utility = area('utility');
  const outlets = area('outlets');
  const wallA = area('wall');
  const doorA = area('door');
  const PZ = -0.08;
  const tripped = new THREE.Group();
  {
    const u = utility;
    box(0.08, 0.66, 0.38, toon(0x9aa1aa, { shine: 0.5, metal: 0.4 }), u, [X0 + 0.04, 1.47, PZ], { r: 0.008 });
    slab([X0 + 0.08, 1.16, PZ - 0.17], [X0 + 0.084, 1.78, PZ + 0.17], toon(0xb7bcc4, { shine: 0.4 }), u, null);
    box(0.03, 0.07, 0.16, M.black, u, [X0 + 0.095, 1.71, PZ], { r: 0.004, ink: 'thin' });
    for (let row = 0; row < 8; row++) {
      for (const sd of [-1, 1]) {
        const y = 1.62 - row * 0.055;
        const isTripped = row === 3 && sd > 0;
        const g = isTripped ? tripped : new THREE.Group();
        g.position.set(X0 + 0.09, y, PZ + sd * 0.055);
        u.add(g);
        box(0.014, 0.045, 0.07, M.black, g, [0, 0, 0], { r: 0.003, ink: null });
        box(0.014, 0.016, 0.014, isTripped ? toon(0xf97316) : toon(0x3a3d44), g, [0.01, 0, isTripped ? 0 : -sd * 0.012], { r: 0.003, ink: null });
      }
    }
    tripped.userData.sd = 1;
    // Panel door with the circuit directory inside.
    const hinge = pivot(u, [X0 + 0.085, 1.47, PZ - 0.19]);
    slab([0, -0.33, 0], [0.01, 0.33, 0.38], toon(0xa7aeb7, { shine: 0.5, metal: 0.4 }), hinge, 'thin');
    slab([-0.002, -0.2, 0.06], [0, 0.22, 0.32], mapped(0xffffff, label([{ text: 'CIRCUITS', size: 22, color: '#222' }, { text: '1 Kitchen 20A', size: 15, color: '#444' }, { text: '2 Bath GFCI 20A', size: 15, color: '#444' }, { text: '3 Living 15A', size: 15, color: '#444' }], '#f4f1e6', 128, 192)), hinge, null);
    box(0.012, 0.04, 0.015, M.black, hinge, [0.012, 0, 0.35], { r: 0.003, ink: 'thin' });
    lidHooks.panelDoor = (k) => (hinge.rotation.y = 1.9 * k);
    // Main water line up through the floor, with a quarter-turn shut-off and a tag.
    tube([V(X0 + 0.07, -0.05, PZ + 0.02), V(X0 + 0.07, 0.68, PZ + 0.02), V(X0 + 0.04, 0.76, PZ + 0.02), V(X0, 0.77, PZ + 0.02)], 0.016, M.copper, u, { seg: 24 });
    box(0.05, 0.08, 0.05, M.brass, u, [X0 + 0.07, 0.42, PZ + 0.02], { r: 0.01 });
    box(0.03, 0.02, 0.16, toon(0xd8432f), u, [X0 + 0.11, 0.44, PZ + 0.02], { r: 0.006 });
    const tag = add(new THREE.PlaneGeometry(0.14, 0.06), new THREE.MeshBasicMaterial({ map: label([{ text: 'MAIN WATER', size: 34, color: '#16111f' }], '#ffd23f', 256, 96) }), u, [X0 + 0.003, 0.58, PZ + 0.13], { rot: [0, Math.PI / 2, 0], ink: 'thin' });
    tag.castShadow = false;
    // Smoke/CO alarm high on the wall and the thermostat by the fridge.
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 24), M.plate, u, [X0 + 0.018, 2.36, PZ], { rot: [0, 0, Math.PI / 2] });
    add(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: 0x22c55e }), u, [X0 + 0.036, 2.36, PZ + 0.03], { ink: null });
    box(0.11, 0.11, 0.025, M.plate, u, [2.78, 1.45, Z0 + 0.013], { r: 0.012 });
    box(0.07, 0.045, 0.004, toon(0x1f3a4a, { emissive: 0x6ee7ff, emissiveIntensity: 0.25 }), u, [2.78, 1.46, Z0 + 0.026], { r: 0.004, ink: null });
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
      box(0.06, 0.1, 0.004, toon(0x2f5fb0), o, [X0 + 0.002, y, OZ], { rot: [0, Math.PI / 2, 0], r: 0.002, ink: null });
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
    add(jag(0.085, 3), toon(0xf6f1e6), w, [X0 + 0.0015, HY, HZ], { rot: [0, Math.PI / 2, 0], ink: 'thin' });
    add(jag(0.065, 4), toon(0x1a1411), w, [X0 + 0.003, HY, HZ], { rot: [0, Math.PI / 2, 0], ink: null });
    // Mud bucket, pan, knife, mesh patch and sanding sponge.
    add(new THREE.CylinderGeometry(0.13, 0.12, 0.3, 20), M.plate, w, [X0 + 0.25, 0.15, 0.56]);
    add(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 20), toon(0x2f5fb0), w, [X0 + 0.25, 0.315, 0.56]);
    box(0.32, 0.07, 0.11, toon(0x9aa3b2, { shine: 0.6, metal: 0.5 }), w, [X0 + 0.4, 0.036, 0.95], { rot: [0, 0.4, 0], r: 0.008 });
    box(0.15, 0.004, 0.1, M.steel, w, [X0 + 0.55, 0.004, 1.18], { rot: [0, -0.3, 0], r: 0.002, ink: 'thin' });
    add(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 10), toon(0x2f5fb0), w, [X0 + 0.66, 0.016, 1.12], { rot: [Math.PI / 2, 0, 1.27] });
    const mesh = canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = '#f2f0e8';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#c9c3b2';
      for (let i = 4; i < 64; i += 6) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
      }
    });
    box(0.16, 0.003, 0.16, mapped(0xffffff, mesh), w, [X0 + 0.3, 0.003, 1.22], { rot: [0, 0.2, 0], r: 0.001, ink: 'thin' });
    box(0.1, 0.03, 0.07, toon(0xf2c94c), w, [X0 + 0.18, 0.015, 1.02], { rot: [0, -0.5, 0], r: 0.008 });
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
    // Weatherstrip on the stops.
    slab([X0 - 0.07, 0.02, DOOR.z0 + 0.035], [X0 - 0.064, DOOR.y1 - 0.03, DOOR.z0 + 0.04], M.black, d, null);
    slab([X0 - 0.07, 0.02, DOOR.z1 - 0.04], [X0 - 0.064, DOOR.y1 - 0.03, DOOR.z1 - 0.035], M.black, d, null);
    // The slab, with six raised panels on the inside face.
    const W = DOOR.z1 - DOOR.z0 - 0.05;
    slab([-0.045, 0.024, 0], [0, 2.05, W], M.door, doorHinge, 'body');
    for (const [y0, y1] of [[1.56, 1.96], [0.98, 1.46], [0.16, 0.88]]) {
      for (const [z0, z1] of [[0.09, 0.39], [W - 0.39, W - 0.09]]) {
        box(0.012, y1 - y0, z1 - z0, M.door, doorHinge, [0.004, (y0 + y1) / 2, (z0 + z1) / 2], { r: 0.006, ink: 'thin' });
      }
    }
    for (const y of [0.25, 1.04, 1.84]) box(0.012, 0.09, 0.03, M.brass, doorHinge, [-0.003, y, -0.004], { r: 0.003, ink: 'thin' });
    for (const sx of [1, -1]) {
      const kx = sx > 0 ? 0.004 : -0.049;
      const knob = add(new THREE.SphereGeometry(0.03, 14, 10), M.brass, doorHinge, [kx + sx * 0.045, 0.92, W - 0.07]);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), M.brass, doorHinge, [kx + sx * 0.008, 0.92, W - 0.07], { rot: [0, 0, Math.PI / 2] });
      add(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8), M.brass, doorHinge, [kx + sx * 0.025, 0.92, W - 0.07], { rot: [0, 0, Math.PI / 2] });
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 16), M.brass, doorHinge, [kx + sx * 0.008, 1.08, W - 0.07], { rot: [0, 0, Math.PI / 2] });
      knobs.push(knob);
    }
    box(0.016, 0.04, 0.012, M.brass, doorHinge, [0.02, 1.08, W - 0.07], { r: 0.004, ink: 'thin' });
    lidHooks.frontDoor = (k) => (doorHinge.rotation.y = 1.45 * k);
    // Doormat inside, a step outside.
    slab([X0 + 0.04, 0.002, DOOR.z0 + 0.05], [X0 + 0.62, 0.014, DOOR.z1 - 0.05], mapped(0xffffff, speckle('#b08850', ['#8f6a3c', '#c9a46a'], 900, [1, 3], [2, 2], 31)), d, 'thin');
    slab([X0 - T - 0.5, -0.2, DOOR.z0 - 0.15], [X0 - T, -0.02, DOOR.z1 + 0.15], mapped(0xffffff, speckle('#a7a39b', ['#8e8a82', '#bdb9b0'], 300, [1, 3], [2, 2], 12)), d);
    pick(d, [X0 - T, 0, DOOR.z0 - 0.08], [X0 + 0.1, DOOR.y1 + 0.08, DOOR.z1 + 0.08]);
  }

  // ---------- living area ----------
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
    const rugM = add(rg, mapped(0xffffff, rug, { halftone: 0.7 }), root, [1.75, 0.006, 1.25], { ink: null });
    rugM.castShadow = false;
    rugM.userData.crease = true;
    // Sofa facing the door.
    const fabric = toon(0xc96f4a);
    const fabricDark = toon(0xa95a3a);
    box(0.85, 0.3, 1.9, fabric, root, [2.92, 0.27, 1.25], { r: 0.04 });
    box(0.25, 0.48, 1.9, fabric, root, [3.22, 0.66, 1.25], { r: 0.06 });
    for (const sd of [-1, 1]) box(0.85, 0.36, 0.18, fabricDark, root, [2.92, 0.5, 1.25 + sd * 0.87], { r: 0.06 });
    for (const sd of [-1, 1]) box(0.6, 0.13, 0.76, fabric, root, [2.78, 0.48, 1.25 + sd * 0.39], { r: 0.05 });
    for (const sd of [-1, 1]) box(0.12, 0.3, 0.32, toon(sd < 0 ? 0xffd23f : 0x6ee7ff), root, [3.04, 0.68, 1.25 + sd * 0.55], { rot: [0, 0, 0.25], r: 0.05 });
    for (const [lx, lz] of [[2.55, 0.35], [2.55, 2.15], [3.28, 0.35], [3.28, 2.15]]) add(new THREE.CylinderGeometry(0.025, 0.018, 0.12, 8), M.walnut, root, [lx, 0.06, lz]);
    // Coffee table with a mug and books.
    box(1.0, 0.04, 0.55, M.walnut, root, [1.55, 0.42, 1.25], { r: 0.012 });
    for (const [dx, dz] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) box(0.04, 0.4, 0.04, M.walnut, root, [1.55 + dx, 0.2, 1.25 + dz], { r: 0.008 });
    box(0.24, 0.04, 0.17, toon(0x3d6b8a), root, [1.35, 0.46, 1.15], { rot: [0, 0.2, 0], r: 0.005 });
    box(0.22, 0.035, 0.15, toon(0xd8a43a), root, [1.35, 0.497, 1.15], { rot: [0, -0.1, 0], r: 0.005 });
    add(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 14), toon(0xf6f3ec), root, [1.8, 0.485, 1.32]);
    // Floor lamp.
    add(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 20), M.black, root, [3.15, 0.012, 2.45]);
    add(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 8), M.black, root, [3.15, 0.76, 2.45]);
    add(new THREE.CylinderGeometry(0.14, 0.2, 0.26, 20, 1, true), toon(0xfff1c4, { emissive: 0xffc870, emissiveIntensity: 0.45, side: THREE.DoubleSide }), root, [3.15, 1.55, 2.45]);
    // Fiddle-leaf fig in the corner.
    add(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 18), toon(0xc8643a), root, [3.15, 0.16, -2.35]);
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 18), toon(0x4a3222), root, [3.15, 0.31, -2.35], { ink: null });
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
    // Two frames over the plant.
    for (const [x0, x1, col] of [[2.6, 2.95, '#6ee7ff'], [3.02, 3.36, '#ff4fd8']] as const) {
      slab([x0, 1.82, Z0], [x1, 2.25, Z0 + 0.03], M.walnut, root, 'thin');
      const art = canvasTex(64, 80, (ctx) => {
        ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 0, 64, 80);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(32, 34, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#16111f'; ctx.fillRect(10, 58, 44, 4);
      });
      slab([x0 + 0.03, 1.85, Z0 + 0.03], [x1 - 0.03, 2.22, Z0 + 0.032], mapped(0xffffff, art), root, null);
    }
  }

  // ---------- ceiling fan or light, hung from a cut-out patch of ceiling ----------
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
    add(under, M.trim, l, [FX, WH, FZ], { ink: null });
    slab([FX - C, WH + 0.07, FZ - C], [FX + C, WH + 0.08, FZ + C], M.cut, l, null);
    for (const [min, max] of [[[FX - C, WH, FZ + C - 0.002], [FX + C, WH + 0.08, FZ + C]], [[FX + C - 0.002, WH, FZ - C], [FX + C, WH + 0.08, FZ + C]], [[FX - C, WH, FZ - C], [FX + C, WH + 0.08, FZ - C + 0.002]], [[FX - C, WH, FZ - C], [FX - C + 0.002, WH + 0.08, FZ + C]]] as [V3, V3][]) slab(min, max, ceilSec, l, 'body');
    // Fan-rated box with its brace, open at the bottom.
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 8, 1, true), toon(0x6d7888, { shine: 0.6, metal: 0.5, side: THREE.DoubleSide }), l, [FX, WH + 0.035, FZ], { ink: null });
    add(new THREE.CircleGeometry(0.075, 8), M.dark, l, [FX, WH + 0.069, FZ], { rot: [Math.PI / 2, 0, 0], ink: null });
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
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), bronze, l, [FX, WH - 0.12, FZ]);
      add(new THREE.CylinderGeometry(0.06, 0.09, 0.07, 20), bronze, hang, [FX, WH - 0.036, FZ]);
      add(new THREE.CylinderGeometry(0.12, 0.14, 0.11, 24), bronze, l, [FX, WH - 0.27, FZ]);
      fanBlades.position.set(FX, WH - 0.28, FZ);
      l.add(fanBlades);
      for (let i = 0; i < 5; i++) {
        const arm = new THREE.Group();
        arm.rotation.y = (i / 5) * Math.PI * 2;
        fanBlades.add(arm);
        box(0.12, 0.012, 0.03, bronze, arm, [0.16, -0.02, 0], { r: 0.004, ink: 'thin' });
        box(0.42, 0.009, 0.12, M.walnut, arm, [0.42, -0.025, 0], { rot: [0.2, 0, 0], r: 0.004 });
      }
      const bulb = toon(0xfff3d2, { emissive: 0xffd88a, emissiveIntensity: 0.9 });
      bulbMats.push(bulb);
      add(new THREE.SphereGeometry(0.1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bulb, l, [FX, WH - 0.33, FZ], { scale: [1, 0.8, 1] });
      lamp.position.set(FX, WH - 0.7, FZ);
    } else {
      slab([FX - 0.1, WH - 0.01, FZ - 0.012], [FX + 0.1, WH, FZ + 0.012], M.steel, l, 'thin');
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), M.brass, hang, [FX, WH - 0.01, FZ]);
      const drum = toon(0xf2e6c8, { emissive: 0xffc870, emissiveIntensity: 0.55, side: THREE.DoubleSide });
      bulbMats.push(drum);
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 32, 1, true), drum, hang, [FX, WH - 0.09, FZ]);
      const diffuser = toon(0xfff6dc, { emissive: 0xffd88a, emissiveIntensity: 0.9 });
      bulbMats.push(diffuser);
      add(new THREE.CircleGeometry(0.235, 32), diffuser, hang, [FX, WH - 0.16, FZ], { rot: [Math.PI / 2, 0, 0], ink: null });
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 32), M.brass, hang, [FX, WH - 0.012, FZ], { ink: null });
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

  // ---------- paint stripping: a half-stripped dresser on a drop cloth ----------
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
    add(cg, mapped(0xffffff, cloth, { side: THREE.DoubleSide }), p, [DX + 0.1, 0.005, DZ + 0.15], { ink: null }).castShadow = false;
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
    box(W, 0.74, D, painted, p, [DX, 0.45, DZ], { r: 0.01 });
    box(W + 0.04, 0.03, D + 0.03, M.oak, p, [DX, 0.835, DZ], { r: 0.008 });
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.05, 0.08, 0.05, painted, p, [DX + lx * (W / 2 - 0.04), 0.04, DZ + lz * (D / 2 - 0.04)], { r: 0.008 });
    slab([DX - 0.41, 0.6, front], [DX + 0.41, 0.79, front + 0.001], M.dark, p, null);
    drawer.position.set(DX, 0.69, front);
    p.add(drawer);
    box(0.84, 0.19, 0.022, stripped, drawer, [0, 0, 0.011], { r: 0.004 });
    slab([-0.4, -0.08, -0.4], [-0.39, 0.07, 0], M.oak, drawer, 'thin');
    slab([0.39, -0.08, -0.4], [0.4, 0.07, 0], M.oak, drawer, 'thin');
    slab([-0.4, -0.09, -0.4], [0.4, -0.08, 0], M.oak, drawer, null);
    slab([-0.4, -0.08, -0.41], [0.4, 0.07, -0.4], M.oak, drawer, 'thin');
    for (const sd of [-1, 1]) add(new THREE.SphereGeometry(0.02, 10, 8), M.walnut, drawer, [sd * 0.22, 0, 0.032]);
    for (const y of [0.46, 0.23]) {
      box(0.84, 0.21, 0.022, painted, p, [DX, y, front + 0.011], { r: 0.004 });
      for (const sd of [-1, 1]) add(new THREE.SphereGeometry(0.02, 10, 8), M.walnut, p, [DX + sd * 0.22, y, front + 0.032]);
    }
    lidHooks.drawer = (k) => (drawer.position.z = front + 0.3 * k);
    // Heat gun, scraper, a can of stripper, a brush and curls of old paint.
    const gun = pivot(p, [DX + 0.62, 0.05, DZ + 0.55]);
    gun.rotation.y = -0.6;
    box(0.2, 0.08, 0.07, toon(0xf08a24), gun, [0, 0.02, 0], { r: 0.02 });
    add(new THREE.CylinderGeometry(0.025, 0.03, 0.12, 12), M.steel, gun, [0.15, 0.02, 0], { rot: [0, 0, Math.PI / 2] });
    box(0.05, 0.12, 0.05, M.black, gun, [-0.06, -0.03, 0], { rot: [0, 0, -0.3], r: 0.015 });
    const scraper = pivot(p, [DX + 0.3, 0.012, DZ + 0.62]);
    scraper.rotation.y = 0.4;
    add(new THREE.CylinderGeometry(0.014, 0.016, 0.13, 10), toon(0xd8432f), scraper, [-0.07, 0, 0], { rot: [0, 0, Math.PI / 2] });
    box(0.06, 0.004, 0.05, M.steel, scraper, [0.03, -0.004, 0], { r: 0.002, ink: 'thin' });
    const canTex = label([{ text: 'STRIPPER', size: 30, color: '#16111f' }, { text: 'citrus gel', size: 18, color: '#16111f' }], '#a3e635', 256, 96);
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 20), [mapped(0xffffff, canTex), M.steel, M.steel] as unknown as THREE.Material, p, [DX - 0.7, 0.09, DZ + 0.6]);
    const brush = pivot(p, [DX - 0.45, 0.015, DZ + 0.7]);
    brush.rotation.y = 1.0;
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), M.oak, brush, [-0.06, 0, 0], { rot: [0, 0, Math.PI / 2] });
    box(0.06, 0.016, 0.05, toon(0x8a6a3a), brush, [0.04, 0, 0], { r: 0.004, ink: 'thin' });
    const curl = toon(0x4f8f8a, { side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      add(new THREE.TorusGeometry(0.018, 0.006, 4, 10, Math.PI * 1.4), curl, p, [DX + range(r, -0.4, 0.5), 0.015, front + range(r, 0.05, 0.35)], { rot: [range(r, 0, 3), range(r, 0, 3), 0], ink: 'thin' });
    }
    pick(p, [DX - 0.5, 0, DZ - D / 2], [DX + 0.5, 0.9, front + 0.05]);
    pick(p, [DX - 0.85, 0, front], [DX + 0.85, 0.15, DZ + 0.9]);
  }

  // ---------- floor cutaway: planks lift off the underlayment ----------
  const floorA = area('floor');
  const planks: THREE.Group[] = [];
  {
    const f = floorA;
    const under = { oak: 0xb5543c, lvp: 0x5d86b5, tile: 0x9a9a94 }[s.floor];
    const ux = (HOLE.x0 + HOLE.x1) / 2 + 0.1;
    slab([HOLE.x0, -0.016, HOLE.z0], [ux, -0.012, HOLE.z1], toon(under), f, null);
    const osb = mapped(0xffffff, speckle('#c9a36a', ['#a8834e', '#dcb87c', '#8f6a3c', '#e3c48e'], 500, [3, 9], [1, 1], 17));
    slab([ux, -0.018, HOLE.z0], [HOLE.x1, -0.014, HOLE.z1], osb, f, null);
    add(new THREE.CylinderGeometry(0.035, 0.035, HOLE.z1 - HOLE.z0 - 0.02, 16), toon(under), f, [ux + 0.035, 0.022, (HOLE.z0 + HOLE.z1) / 2], { rot: [Math.PI / 2, 0, 0] });
    const n = 3;
    const pw = (HOLE.z1 - HOLE.z0) / n;
    const len = HOLE.x1 - HOLE.x0;
    for (let i = 0; i < n; i++) {
      const tex = FLOOR_TEX();
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
    // A box of flooring and a tapping block nearby.
    box(0.5, 0.09, 0.2, mapped(0xffffff, label([{ text: 'FLOORING', size: 28, color: '#16111f' }], '#c69c64', 256, 64)), f, [1.85, 0.045, 2.45], { rot: [0, 0.15, 0], r: 0.006 });
    box(0.5, 0.09, 0.2, toon(0xc69c64), f, [1.83, 0.135, 2.47], { rot: [0, 0.05, 0], r: 0.006 });
    box(0.22, 0.04, 0.06, toon(0x2f2f2f), f, [1.55, 0.02, 2.3], { rot: [0, -0.3, 0], r: 0.006 });
    pick(f, [HOLE.x0 - 0.05, -0.05, HOLE.z0 - 0.05], [HOLE.x1 + 0.05, 0.15, HOLE.z1 + 0.05]);
  }

  // ---------- outside: trim, eaves and gutters, downspout, hose bib, porch light ----------
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
  const shingles = mapped(0xffffff, canvasTex(64, 64, (ctx) => {
    ctx.fillStyle = '#3d424e'; ctx.fillRect(0, 0, 64, 64);
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = '#525866'; ctx.fillRect(0, row * 16, 64, 12);
      for (let x = (row % 2) * 8; x < 64; x += 16) { ctx.fillStyle = '#2a2e37'; ctx.fillRect(x, row * 16, 1.5, 12); }
    }
  }, [12, 1]), { halftone: 0.6 });
  const soffit = toon(0xe9e5dc);
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
  // Leaves packed in the back gutter.
  {
    const leafCols = [0x9a5a2a, 0xc98a3a, 0x6f7a33, 0x7b4a24].map((c) => toon(c));
    const lg = new THREE.BoxGeometry(0.06, 0.008, 0.035);
    for (let i = 0; i < 70; i++) {
      const x = XO - OV - 0.08 + r() * (X1 - XO + OV - 0.2);
      add(lg, leafCols[i % 4], gutA, [x, GY0 + 0.016 + r() * 0.03, ZO - OV - 0.06 + (r() - 0.5) * 0.07], { rot: [r() * 0.6, r() * 3, r() * 0.6], ink: null, shadow: false });
    }
  }
  // Gutter guard over the leafiest run; lifts on a hinge along the fascia.
  const guardHinge = pivot(gutA, [0, GY1 + 0.004, ZO - OV]);
  {
    const screen = mapped(0xffffff, canvasTex(32, 32, (ctx) => {
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
    box(0.075, 0.06, 0.06, M.gutter, gutA, [DX, GY0 - 0.02, zg], { r: 0.006 });
    const dy = GY0 - 0.03 - yTop;
    const dz = zg - zw;
    box(0.075, Math.hypot(dy, dz), 0.06, M.gutter, gutA, [DX, (GY0 - 0.03 + yTop) / 2, (zg + zw) / 2], { rot: [Math.atan2(dz, dy), 0, 0], r: 0.006 });
    box(0.075, yTop + 0.22, 0.06, M.gutter, gutA, [DX, (yTop - 0.22) / 2, zw], { r: 0.006 });
    for (const y of [0.4, 1.4]) slab([DX - 0.05, y, zw - 0.035], [DX + 0.05, y + 0.02, zw + 0.04], M.gutter, gutA, 'thin');
    box(0.075, 0.06, 0.12, M.gutter, gutA, [DX, -0.25, zw - 0.03], { rot: [-0.5, 0, 0], r: 0.006 });
    box(0.075, 0.06, 0.6, M.gutter, gutA, [DX, -0.29, zw - 0.39], { rot: [-0.04, 0, 0], r: 0.006 });
    slab([DX - 0.13, -0.35, zw - 1.0], [DX + 0.13, -0.31, zw - 0.66], M.concrete, gutA, 'thin');
    pick(gutA, [DX - 0.12, -0.35, zw - 1.0], [DX + 0.12, GY0, zw + 0.05]);
  }
  pick(gutA, [XO - OV - 0.14, GY0 - 0.04, ZO - OV - 0.14], [X1, WH + 0.08, ZO]);
  pick(gutA, [XO - OV - 0.14, GY0 - 0.04, ZO], [XO, WH + 0.08, Z1]);

  // Hose bib with a coiled hose, a porch light, a weatherproof outlet and a loose siding panel.
  const porchBulb = toon(0xfff3d2, { emissive: 0xffc861, emissiveIntensity: 0.9 });
  {
    const e = extA;
    const HB = { y: 0.42, z: -1.75 };
    add(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16), M.copper, e, [XO - 0.008, HB.y, HB.z], { rot: [0, 0, Math.PI / 2] });
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 12), M.brass, e, [XO - 0.055, HB.y, HB.z], { rot: [0, 0, Math.PI / 2] });
    add(new THREE.CylinderGeometry(0.018, 0.016, 0.07, 12), M.brass, e, [XO - 0.1, HB.y - 0.03, HB.z]);
    add(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 6), M.brass, e, [XO - 0.07, HB.y + 0.035, HB.z]);
    add(new THREE.TorusGeometry(0.028, 0.007, 6, 14), M.red, e, [XO - 0.07, HB.y + 0.058, HB.z], { rot: [Math.PI / 2, 0, 0] });
    // Hose hanger and coil.
    slab([XO - 0.03, 0.62, -1.38], [XO, 0.72, -1.12], toon(0x3a3d44), e, 'thin');
    slab([XO - 0.16, 0.66, -1.32], [XO - 0.03, 0.7, -1.18], toon(0x3a3d44), e, 'thin');
    const hose = toon(0x3f9a4a, { shine: 0.4 });
    for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(0.2, 0.013, 8, 32), hose, e, [XO - 0.05 - i * 0.026, 0.5, -1.25], { rot: [0, Math.PI / 2, 0], scale: [1, 1.2, 1] });
    tube([V(XO - 0.1, HB.y - 0.07, HB.z), V(XO - 0.14, HB.y - 0.2, HB.z + 0.05), V(XO - 0.16, 0.18, -1.45), V(XO - 0.1, 0.27, -1.3)], 0.013, hose, e, { seg: 20 });
    // Porch light beside the door.
    const PLZ = DOOR.z0 - 0.24;
    slab([XO - 0.02, 1.62, PLZ - 0.06], [XO, 1.86, PLZ + 0.06], M.black, e, 'thin');
    slab([XO - 0.15, 1.82, PLZ - 0.08], [XO - 0.02, 1.86, PLZ + 0.08], M.black, e, 'thin');
    slab([XO - 0.13, 1.64, PLZ - 0.065], [XO - 0.03, 1.82, PLZ + 0.065], porchBulb, e, 'body');
    slab([XO - 0.14, 1.62, PLZ - 0.075], [XO - 0.02, 1.64, PLZ + 0.075], M.black, e, 'thin');
    // Weather-resistant GFCI under an in-use bubble cover.
    const OUTZ = DOOR.z0 - 0.45;
    slab([XO - 0.012, 0.42, OUTZ - 0.05], [XO, 0.58, OUTZ + 0.05], M.plate, e, 'thin');
    slab([XO - 0.018, 0.47, OUTZ - 0.025], [XO - 0.012, 0.53, OUTZ + 0.025], toon(0xe9e6de), e, null);
    slab([XO - 0.08, 0.4, OUTZ - 0.065], [XO - 0.012, 0.6, OUTZ + 0.065], glass({ tint: 0x9fb3c8, streak: 0xffffff, alpha: 0.28, streaks: 0.4 }), e, 'thin');
    // Loose siding panel over house wrap; it swings out from its top edge.
    const SP = { y0: 0.9, y1: 1.35, z0: -0.65, z1: 0.35 };
    const wrap = mapped(0xffffff, canvasTex(128, 64, (ctx) => {
      ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#5b86b8'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('HOUSE WRAP', 8, 20); ctx.fillText('HOUSE WRAP', 60, 48);
    }));
    slab([XO - 0.005, SP.y0, SP.z0], [XO - 0.001, SP.y1, SP.z1], [M.cut, wrap, M.cut, M.cut, M.cut, M.cut], e, null);
    for (const z of [-0.45, -0.05, 0.25]) add(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 8), M.steel, e, [XO - 0.007, SP.y1 - 0.03, z], { rot: [0, 0, Math.PI / 2], ink: null });
    const spHinge = pivot(e, [XO - 0.007, SP.y1, 0]);
    slab([-0.012, SP.y0 - SP.y1, SP.z0], [0, 0, SP.z1], [M.cut, siding(SP.y0, SP.y1), M.cut, M.cut, M.cut, M.cut], spHinge, 'body');
    // It already sags a little when closed: that's the "loose" panel.
    lidHooks.sidingPanel = (k) => (spHinge.rotation.z = -0.07 - 0.88 * k);
    lidHooks.sidingPanel(0);
    pick(e, [XO - 0.35, -0.35, Z0 + 0.05], [XO, WH - 0.2, DOOR.z0 - 0.1]);
  }

  // ---------- crease lines ----------
  // Ink hulls only trace silhouettes; these add the hard edges (wall tops, cabinet corners, rims) in the same ink.
  {
    const mat = new LineMaterial({ color: INK, linewidth: 1.5, worldUnits: false });
    mat.resolution.set(window.innerWidth, window.innerHeight);
    lineMaterials.add(mat);
    const cache = new Map<THREE.BufferGeometry, number[] | null>();
    const size = new THREE.Vector3();
    const ws = new THREE.Vector3();
    const edgesFor = (g: THREE.BufferGeometry, optIn: boolean): number[] | null => {
      if (cache.has(g)) return cache.get(g)!;
      let src: THREE.BufferGeometry | null = null;
      const p = (g as THREE.BoxGeometry).parameters;
      if (g.type === 'BoxGeometry' || g.type === 'RoundedBoxGeometry') src = new THREE.EdgesGeometry(new THREE.BoxGeometry(p.width, p.height, p.depth));
      else if (g.type === 'CylinderGeometry' || g.type === 'ExtrudeGeometry' || optIn) src = new THREE.EdgesGeometry(g, 50);
      let out: number[] | null = null;
      if (src) {
        // Nudge every vertex 3 mm outward so the line sits just proud of its faces.
        g.computeBoundingBox();
        const c = g.boundingBox!.getCenter(new THREE.Vector3()).toArray();
        const pos = src.getAttribute('position') as THREE.BufferAttribute;
        out = [];
        for (let i = 0; i < pos.count; i++) {
          const v = [pos.getX(i), pos.getY(i), pos.getZ(i)];
          for (let a = 0; a < 3; a++) out.push(v[a] + Math.sign(Math.round((v[a] - c[a]) * 1e4)) * 0.003);
        }
        src.dispose();
      }
      cache.set(g, out);
      return out;
    };
    // Anything a lid or the fan moves keeps its own lines; the rest merge into one draw call.
    const moving = new Set<THREE.Object3D>();
    {
      root.updateMatrixWorld(true);
      const snap = new Map<THREE.Object3D, THREE.Matrix4>();
      root.traverse((o) => snap.set(o, o.matrixWorld.clone()));
      for (const hook of Object.values(lidHooks)) hook?.(1);
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if (!snap.get(o)!.equals(o.matrixWorld)) moving.add(o);
      });
      for (const hook of Object.values(lidHooks)) hook?.(0);
      root.updateMatrixWorld(true);
      fanBlades.traverse((o) => moving.add(o));
    }
    const targets: THREE.Mesh[] = [];
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.ink || m.userData.beacon || m.userData.noCrease || (m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (mats.some((x) => !x.visible || x.transparent || (x as THREE.MeshBasicMaterial).isMeshBasicMaterial || (x as THREE.ShaderMaterial).isShaderMaterial)) return;
      m.geometry.computeBoundingBox();
      m.geometry.boundingBox!.getSize(size);
      m.getWorldScale(ws);
      // Skip screws, wires and leaves: lines on those just turn to fuzz.
      if (Math.max(size.x * ws.x, size.y * ws.y, size.z * ws.z) / K < 0.05) return;
      targets.push(m);
    });
    const ink = (g: LineSegmentsGeometry, parent: THREE.Object3D) => {
      const l = new LineSegments2(g, mat);
      l.userData.ink = true;
      l.raycast = () => {};
      parent.add(l);
    };
    // The outer walls as two clean boxes: top edges, cut ends and the inside corner.
    const seg: number[] = [];
    const line = (a: V3, b: V3) => seg.push(...a, ...b);
    const e = 0.003;
    line([X0 + e, WH + e, Z0 + e], [X1 + e, WH + e, Z0 + e]);
    line([X0 - T - e, WH + e, Z0 - T - e], [X1 + e, WH + e, Z0 - T - e]);
    line([X0 + e, WH + e, Z0 + e], [X0 + e, WH + e, Z1 + e]);
    line([X0 - T - e, WH + e, Z0 - T - e], [X0 - T - e, WH + e, Z1 + e]);
    line([X0 + e, 0, Z0 + e], [X0 + e, WH, Z0 + e]);
    for (const [x, z] of [[X1 + e, Z0 + e], [X1 + e, Z0 - T - e]]) line([x, 0, z], [x, WH, z]);
    line([X1 + e, WH + e, Z0 - T], [X1 + e, WH + e, Z0]);
    for (const [x, z] of [[X0 + e, Z1 + e], [X0 - T - e, Z1 + e]]) line([x, 0, z], [x, WH, z]);
    line([X0 - T, WH + e, Z1 + e], [X0, WH + e, Z1 + e]);
    // Static edges, moved into root space.
    const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const rel = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const own = new Map<number[], LineSegmentsGeometry>();
    for (const m of targets) {
      const arr = edgesFor(m.geometry, Boolean(m.userData.crease));
      if (!arr) continue;
      if (moving.has(m)) {
        if (!own.has(arr)) own.set(arr, new LineSegmentsGeometry().setPositions(arr));
        ink(own.get(arr)!, m);
        continue;
      }
      rel.multiplyMatrices(rootInv, m.matrixWorld);
      for (let i = 0; i < arr.length; i += 3) {
        v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(rel);
        seg.push(v.x, v.y, v.z);
      }
    }
    ink(new LineSegmentsGeometry().setPositions(seg), root);
  }

  // ---------- glow lists, beacons and views ----------
  const glow = new Map<AreaId, THREE.Mesh[]>();
  for (const [id, g] of areas) {
    const list: THREE.Mesh[] = [];
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      // Everything visible except ink hulls and invisible pick boxes: the outline traces its silhouette.
      const mat = m.material as THREE.Material & { opacity: number };
      if (m.isMesh && !m.userData.ink && !Array.isArray(m.material) && mat.visible !== false && !(mat.transparent && mat.opacity < 0.05)) list.push(m);
      else if (m.isMesh && Array.isArray(m.material)) list.push(m);
    });
    glow.set(id, list);
  }

  const beacons = new Map<AreaId, THREE.Mesh>();
  const beaconGeom = new THREE.SphereGeometry(0.09, 16, 12);
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
  beaconAt('counters', [1.15, 1.15, Z0 + 0.45]);
  beaconAt('sink', [SINK.cx, 1.4, Z0 + 0.45]);
  beaconAt('appliances', [-1.38, 1.3, Z0 + 0.6]);
  beaconAt('window', [-0.15, 2.32, Z0 + 0.15]);
  beaconAt('toilet', [X0 + 0.35, 1.0, TZ]);
  beaconAt('bath', [-2.7, 0.85, Z0 + 0.4]);
  beaconAt('utility', [X0 + 0.15, 1.98, PZ]);
  beaconAt('outlets', [X0 + 0.15, 0.62, OZ]);
  beaconAt('wall', [X0 + 0.15, 1.18, 0.86]);
  beaconAt('door', [X0 + 0.15, 2.3, 2.0]);
  beaconAt('lights', [FX + 0.5, 2.0, FZ + 0.4]);
  beaconAt('gutters', [-2.3, WH + 0.3, ZO - OV - 0.06]);
  beaconAt('exterior', [XO - 0.3, 1.25, -0.15]);
  beaconAt('paint', [-0.85, 1.08, 1.6]);
  beaconAt('floor', [0.8, 0.28, 2.35]);
  // Which side of the outer walls the camera must be on to see each beacon.
  for (const [id, b] of beacons) {
    b.userData.seen =
      id === 'gutters' ? (c: THREE.Vector3) => c.z < Z0 * K || c.x < X0 * K || c.y > (WH + 1.2) * K
      : id === 'exterior' ? (c: THREE.Vector3) => c.x < XO * K
      : (c: THREE.Vector3) => c.x > X0 * K && c.z > Z0 * K;
  }

  const view = (target: V3, dir: V3, dist: number): View => {
    const t = V(...target);
    const p = t.clone().addScaledVector(V(...dir).normalize(), dist);
    return { target: [t.x * K, t.y * K, t.z * K], pos: [p.x * K, p.y * K, p.z * K] };
  };
  const views: Record<AreaId, View> = {
    counters: view([0.45, 1.05, Z0 + 0.4], [0.15, 0.5, 1], 3.4),
    sink: view([SINK.cx, 0.7, Z0 + 0.35], [0.15, 0.35, 1], 2.3),
    appliances: view([0.3, 0.95, Z0 + 0.4], [0.02, 0.14, 1], 5.0),
    window: view([-0.15, 1.55, Z0], [0.1, 0.15, 1], 2.5),
    toilet: view([X0 + 0.3, 0.5, TZ], [0.6, 1.7, 0.22], 2.1),
    bath: view([-2.75, 0.7, -1.55], [0.75, 0.95, 0.75], 3.3),
    utility: view([X0, 1.15, -0.02], [1, 0.25, 0.1], 2.6),
    outlets: view([X0 + 0.05, 0.7, OZ], [1, 0.35, 0.65], 2.1),
    wall: view([X0 + 0.05, 0.85, 0.86], [1, 0.4, 0.55], 2.1),
    door: view([X0, 1.1, 1.95], [1, 0.3, 0.25], 3.8),
    lights: view([FX, 2.2, FZ], [0.45, 0.02, 1], 2.6),
    paint: view([-0.8, 0.5, 1.65], [0.35, 0.6, 1], 2.6),
    floor: view([0.8, 0.05, 2.3], [0.3, 0.9, 1], 2.2),
    gutters: view([-2.2, 1.5, ZO - 0.4], [-0.45, 0.75, -1], 4.6),
    exterior: view([XO, 0.95, -0.15], [-1, 0.4, 0.3], 4.8),
  };
  const overview: View = view([0, 0.6, 0.1], [0.85, 0.95, 1.1], 11.5);

  // ---------- behaviour ----------
  const lids = new Map<LidId, { open: boolean; k: number }>();
  let clock = 0;
  const drops: THREE.Mesh[] = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff });
  const dropGeo = new THREE.SphereGeometry(0.008, 8, 6);
  let nextDrip = 1.5;
  let spin = 1.6;
  let lightOn = true;
  let flushAt = -10;
  let burnAt = -10;
  let jiggleAt = -10;
  const burners = (appliances.userData.burners ?? []) as THREE.Mesh[];
  const burnerCold = burners[0]?.material as THREE.Material;
  const burnerHot = new THREE.MeshBasicMaterial({ color: 0xff5a1f });
  const drip = () => {
    const d = new THREE.Mesh(dropGeo, dropMat);
    d.position.copy(DRIP_FROM);
    d.userData.born = clock;
    sink.add(d);
    drops.push(d);
  };
  const setLight = (on: boolean) => {
    lightOn = on;
    lamp.intensity = on ? 0.9 : 0;
    for (const m of bulbMats) (m as THREE.MeshToonMaterial).emissiveIntensity = on ? 0.9 : 0.05;
    for (const p of lightSwitch) ((p.userData.device as THREE.Group).children[0].rotation.x = on ? -0.35 : 0.35);
  };

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
        tag: `hlid-${lid}`,
        update: (t) => {
          st.k = lerp(k0, open ? 1 : 0, t);
          lidHooks[lid]?.(st.k);
        },
      });
    },
    poke(id) {
      if (id === 'sink') for (let i = 0; i < 5; i++) setTimeout(drip, i * 160);
      else if (id === 'lights') {
        if (s.ceiling === 'fan') spin = 9;
        else setLight(!lightOn);
      } else if (id === 'outlets') setLight(!lightOn);
      else if (id === 'toilet') flushAt = clock;
      else if (id === 'appliances') burnAt = clock;
      else if (id === 'door') jiggleAt = clock;
      else if (id === 'exterior') porchBulb.emissiveIntensity = porchBulb.emissiveIntensity > 0.5 ? 0.05 : 0.9;
      else if (id === 'utility') {
        // Reset the tripped breaker: all the way off, then on.
        const handle = tripped.children[1];
        (handle as THREE.Mesh).material = toon(0x3a3d44);
        handle.position.z = -0.012;
      }
    },
    update(t) {
      const dt = Math.min(0.05, t - clock);
      clock = t;
      shared.uTime.value = t;
      // The dripping faucet.
      if (t > nextDrip) {
        drip();
        nextDrip = t + 2.4;
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const age = t - d.userData.born;
        d.position.y = DRIP_FROM.y - 4.9 * age * age;
        if (d.position.y < 0.68) {
          sink.remove(d);
          drops.splice(i, 1);
        }
      }
      // Fan blades: a lazy spin, faster for a while when poked.
      spin += (1.6 - spin) * Math.min(1, dt * 0.6);
      fanBlades.rotation.y += spin * dt;
      // Flush: handle down, flapper up, tank drains and refills.
      const fl = t - flushAt;
      if (fl >= 0 && fl < 6) {
        const open = fl < 1.2 ? Math.min(1, fl * 4) : Math.max(0, 1 - (fl - 1.2) * 3);
        handleArm.rotation.x = 0;
        handleArm.rotation.z = 0;
        handleArm.rotation.y = 0;
        handleArm.position.y = 0.72 + 0.03 * open;
        flapper.rotation.z = 1.1 * open;
        const level = fl < 1.5 ? 1 - fl / 1.5 : Math.min(1, (fl - 1.5) / 4);
        for (const w of tankWater) {
          w.scale.y = Math.max(0.05, level);
          w.position.y = 0.42 + (0.26 * Math.max(0.05, level)) / 2;
        }
      }
      // Burners glow for a few seconds.
      const hot = t - burnAt < 3;
      for (const b of burners) b.material = hot ? burnerHot : burnerCold;
      // Door knob jiggle.
      const jg = t - jiggleAt;
      knobs.forEach((k) => (k.rotation.x = jg < 0.8 ? Math.sin(jg * 30) * 0.3 * (1 - jg / 0.8) : 0));
    },
    dispose() {
      disposeTree(root);
    },
  };
}
