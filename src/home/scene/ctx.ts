import * as THREE from 'three';
import { toon, type InkWeight } from '../../shared/toon';
import { add, box, rng, speckle, woodTexture, type V3, textured } from '../../shared/scene/kit';
import { WALL_HEX, type Setup } from '../data/setup';
import type { AreaId, LidId } from '../data/areas';
import { K } from './room';
import { EXT_LAYERS, INT_LAYERS, sectionTex, lapSiding } from './textures';
import { MAT, FINISH } from '../../shared/scene/materials';
import { createSpots } from '../../shared/scene/rigKit';
import { tag } from '../../shared/scene/sceneTags';
import { C } from './palette';
import { TONE } from '../../shared/theme';

export function createCtx(s: Setup) {
  const r = rng(77);
  const lidHooks: Partial<Record<LidId, (k: number) => void>> = {};
  /** What a wall color or floor change repaints in place; the counter and ceiling choices rebuild the house. */
  const looks: ((s: Setup) => void)[] = [];
  const look = (fn: (s: Setup) => void) => void looks.push(fn);
  const root = new THREE.Group();
  root.scale.setScalar(K);

  const M = {
    paint: toon(WALL_HEX[s.wall]),
    bathPaint: toon(C.bathPaint),
    cut: toon(TONE.linen),
    concrete: textured(speckle('#a7a39b', ['#8e8a82', '#bdb9b0'], 300, [1, 3], [3, 1], 44)),
    gutter: toon(C.trim, { shine: 0.5 }),
    secExtV: textured(sectionTex(EXT_LAYERS, false)),
    secExtU: textured(sectionTex(EXT_LAYERS, true)),
    secIntV: textured(sectionTex(INT_LAYERS, false)),
    secIntU: textured(sectionTex(INT_LAYERS, true)),
    dark: toon(TONE.charcoal),
    trim: toon(C.trim),
    cab: toon(C.cabinet),
    cabIn: toon(C.cabinetIn),
    brass: MAT.brass(),
    steel: toon(TONE.steel, FINISH.polished),
    chrome: toon(TONE.polished, FINISH.chrome),
    black: toon(TONE.soot, { shine: 0.5 }),
    porcelain: toon(TONE.porcelain, { shine: 0.6 }),
    pvc: MAT.pvc(),
    copper: toon(C.copper, FINISH.bright),
    braided: toon(C.satinMetal, FINISH.satin),
    plate: toon(C.trim, { shine: 0.3 }),
    red: MAT.red(),
    coldBlue: MAT.coldBlue(),
    door: toon(C.door),
    oak: textured(woodTexture('#c8955c', '#9a6a3a', [1, 1])),
    walnut: textured(woodTexture('#7a5236', '#553620', [1, 1])),
    water: MAT.water(),
    wire: { black: toon(C.wire.black), white: toon(TONE.porcelain), bare: toon(C.copper, FINISH.bright), green: toon(C.wire.ground) },
  };

  look((n) => M.paint.color.setHex(WALL_HEX[n.wall]));

  const { groups: areas, picks, spot: area, pick: pickBox } = createSpots<AreaId>(root);
  const siding = (y0: number, y1: number) => textured(lapSiding(y0, y1), { halftone: 0.5 });
  /** Outer walls: picks behind them don't count. */
  const blocker = (m: THREE.Mesh) => {
    tag(m, 'blocker', true);
    // Walls are built in pieces round the window and door; their outline is drawn once, below.
    m.userData.noCrease = true;
    picks.push(m);
    return m;
  };
  /** A pick box from corner `min` to corner `max`. */
  const pick = (g: THREE.Group, min: V3, max: V3) =>
    pickBox(g, [max[0] - min[0], max[1] - min[1], max[2] - min[2]], [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]);
  /** Axis-aligned box from corner to corner, one material per face (+x, -x, +y, -y, +z, -z). */
  function slab(min: V3, max: V3, mat: THREE.Material | THREE.Material[], parent: THREE.Object3D = root, ink: InkWeight | null = 'body'): THREE.Mesh {
    const g = new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    return add(g, mat as THREE.Material, parent, { at: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], ink });
  }
  /** A pivot group, so lids can swing or slide around a hinge. */
  function pivot(parent: THREE.Object3D, p: V3): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...p);
    parent.add(g);
    return g;
  }

  /** Shaker cabinet door or drawer front centered on `p`, facing +z (or +x when `side`). */
  function shaker(parent: THREE.Object3D, w: number, h: number, p: V3, mat: THREE.Material = M.cab, side = false, pull: 'bar' | 'knob' | null = 'bar', pullAt: 'top' | 'side' | 'side-r' = 'side'): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...p);
    if (side) g.rotation.y = Math.PI / 2;
    parent.add(g);
    box(w - 0.004, h - 0.004, 0.02, mat, g, { r: 0.004 });
    const st = Math.min(0.055, w * 0.18, h * 0.18);
    for (const sx of [-1, 1]) box(st, h - 0.004, 0.008, mat, g, { at: [sx * (w / 2 - st / 2 - 0.002), 0, 0.012], r: 0.002 });
    for (const sy of [-1, 1]) box(w - 2 * st, st, 0.008, mat, g, { at: [0, sy * (h / 2 - st / 2 - 0.002), 0.012], r: 0.002 });
    if (pull === 'bar') {
      const px = pullAt === 'top' ? 0 : pullAt === 'side' ? w / 2 - st / 2 : -(w / 2 - st / 2);
      const py = pullAt === 'top' ? h / 2 - st / 2 : 0;
      const len = Math.min(0.12, pullAt === 'top' ? w * 0.4 : h * 0.4);
      box(pullAt === 'top' ? len : 0.012, pullAt === 'top' ? 0.012 : len, 0.012, M.brass, g, { at: [px, py, 0.03], r: 0.005 });
    } else if (pull === 'knob') {
      add(new THREE.SphereGeometry(0.018, 10, 8), M.brass, g, { at: [0, 0, 0.032] });
    }
    return g;
  }
  /** Wall plate with a duplex outlet, GFCI or toggle switch, facing `face`. */
  function plateWith(parent: THREE.Object3D, kind: 'duplex' | 'gfci' | 'switch', p: V3, face: '+x' | '+z'): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...p);
    if (face === '+x') g.rotation.y = Math.PI / 2;
    parent.add(g);
    box(0.072, 0.118, 0.008, M.plate, g, { at: [0, 0, 0.004], r: 0.003 });
    const dev = new THREE.Group();
    dev.position.z = 0.008;
    g.add(dev);
    if (kind === 'duplex') {
      for (const y of [-0.022, 0.022]) {
        box(0.036, 0.034, 0.006, M.plate, dev, { at: [0, y, 0.002], r: 0.008 });
        for (const x of [-0.007, 0.007]) slab([x - 0.0015, y + 0.002, 0.004], [x + 0.0015, y + 0.012, 0.0055], M.black, dev, null);
        slab([-0.003, y - 0.012, 0.004], [0.003, y - 0.006, 0.0055], M.black, dev, null);
      }
    } else if (kind === 'gfci') {
      box(0.04, 0.09, 0.007, M.plate, dev, { at: [0, 0, 0.002], r: 0.004 });
      box(0.024, 0.01, 0.004, M.black, dev, { at: [0, 0.004, 0.006], r: 0.002, ink: null });
      box(0.012, 0.01, 0.004, M.red, dev, { at: [0, -0.008, 0.006], r: 0.002, ink: null });
    } else {
      box(0.012, 0.026, 0.02, M.plate, dev, { at: [0, 0.004, 0.008], rot: [-0.35, 0, 0], r: 0.004 });
    }
    g.userData.device = dev;
    return g;
  }
  return { s, r, lidHooks, looks, look, root, M, areas, picks, siding, blocker, area, pick, slab, pivot, shaker, plateWith };
}

export type HomeCtx = ReturnType<typeof createCtx>;
