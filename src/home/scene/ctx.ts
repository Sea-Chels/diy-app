import * as THREE from 'three';
import { toon } from '../../shared/toon';
import { add, box, mapped, rng, speckle, woodTexture, type V3 } from '../../shared/scene/kit';
import { hex } from '../../shared/theme';
import { WALL_HEX, type Setup } from '../data/setup';
import type { AreaId, LidId } from '../data/areas';
import { K, UNIT_BOX } from './room';
import { EXT_LAYERS, INT_LAYERS, sectionTex, subway, lapSiding } from './textures';

export function createCtx(s: Setup) {
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
    water: new THREE.MeshBasicMaterial({ color: hex('water'), transparent: true, opacity: 0.5 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffe6a8 }),
    subwayKitchen: mapped(0xffffff, subway([4, 1])),
    wire: { black: toon(0x202020), white: toon(0xf1f1f1), bare: toon(0xc77a45, { shine: 0.7, metal: 0.6 }), green: toon(0x2e9a4c) },
  };

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
  return { s, r, lidHooks, root, M, areas, picks, siding, blocker, area, pick, slab, pivot, shaker, plateWith };
}

export type HomeCtx = ReturnType<typeof createCtx>;
