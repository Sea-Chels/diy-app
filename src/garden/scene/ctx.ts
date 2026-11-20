import * as THREE from 'three';
import { toon, type InkWeight } from '../../shared/toon';
import { add, canvasTex, label, rng, speckle, UNIT_BOX, V, woodTexture, type V3, textured } from '../../shared/scene/kit';
import { Batches } from './batches';
import type { Setup } from '../data/setup';
import type { AreaId, LidId } from '../data/areas';
import { plantKit } from './plants/kit';
import { K } from './geometry';
import { MAT, FINISH } from '../../shared/scene/materials';
import { createSpots } from '../../shared/scene/rigKit';
import { C } from './palette';
import { TONE } from '../../shared/theme';

export function createCtx(s: Setup) {
  const season = s.season;
  const r = rng(20240611);
  const b = new Batches();
  const k = plantKit(b, season, r);
  // Filled in while building, used by setLid / update.
  const lidHooks: Partial<Record<LidId, (k: number) => void>> = {};
  const steam: THREE.Mesh[] = [];
  const steamBase = new THREE.Vector3();
  const toolSwing: THREE.Group[] = [];
  const spigot = new THREE.Vector3();

  const root = new THREE.Group();
  root.scale.setScalar(K);

  // White materials are tinted per instance.
  const white = toon(TONE.white);
  const whiteShiny = toon(TONE.white, { shine: 0.7 });
  const M = {
    galv: toon(TONE.silver, FINISH.bright),
    galvDark: toon(C.galvDark, FINISH.satin),
    cedar: textured(woodTexture('#c27a4c', '#8a4628', [1, 1])),
    cedarDark: textured(woodTexture('#9a5a36', '#6a3a20', [1, 1])),
    weathered: textured(woodTexture('#a89a86', '#7a6a58', [1, 1])),
    shedWall: textured(woodTexture('#7f9fae', '#5f7f8e', [1, 3])),
    trim: toon(TONE.linen),
    roof: textured(canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = '#5d6470';
      ctx.fillRect(0, 0, 128, 128);
      for (let row = 0; row < 8; row++) {
        ctx.fillStyle = '#4a505b';
        ctx.fillRect(0, row * 16 + 13, 128, 3);
        for (let c = 0; c < 6; c++) ctx.fillRect(((c + (row % 2) * 0.5) * 128) / 6, row * 16, 2, 14);
      }
    }, [3, 2])),
    soil: textured(speckle('#4a3222', ['#3a2618', '#5d4030', '#2c1c12', '#6a4a35'], 900, [2, 5], [3, 2], 4)),
    gravel: textured(speckle('#b9ad9b', ['#8f8576', '#d8cfc0', '#a39684', '#7d7366', '#e6ddd0'], 2600, [2, 5], [10, 8], 9), { halftone: 0.8 }),
    stone: textured(speckle('#a7a39b', ['#8e8a82', '#bdb9b0', '#7b776f'], 300, [1, 3], [1, 1], 12)),
    brick: textured(canvasTex(128, 64, (ctx) => {
      ctx.fillStyle = '#d8cbb8';
      ctx.fillRect(0, 0, 128, 64);
      for (let row = 0; row < 4; row++) {
        for (let c = -1; c < 4; c++) {
          ctx.fillStyle = ['#a8492f', '#b9573a', '#94402a'][(row + c + 3) % 3];
          ctx.fillRect(c * 40 + (row % 2) * 20 + 2, row * 16 + 2, 36, 12);
        }
      }
    }, [2, 1])),
    pvc: MAT.pvc(),
    hose: MAT.hose(),
    drip: toon(TONE.soot, { shine: 0.3 }),
    terracotta: MAT.terracotta(),
    tote: toon(C.tote, { shine: 0.3 }),
    cloth: new THREE.MeshToonMaterial({ color: TONE.porcelain, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }),
    steel: toon(TONE.toolSteel, FINISH.bright),
    handle: toon(TONE.tan),
    blade: toon(C.blade, FINISH.chrome),
    red: MAT.red(),
    barrel: toon(C.barrel, { shine: 0.35 }),
    brass: MAT.brass(),
    cardboard: textured(canvasTex(64, 16, (ctx) => {
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

  const { groups: areas, picks, spot, pick } = createSpots<AreaId>(root);
  /** Batched instances under the area merge into one draw call per material. */
  function area(id: AreaId, x: number, z: number, rotY = 0): THREE.Group {
    const g = spot(id);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    g.userData.batchRoot = true;
    g.updateWorldMatrix(true, false);
    return g;
  }
  /** Instance a unit geometry (box, cylinder) with a matrix built from position, rotation and size. */
  function inst(g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: V3, size: V3, color: THREE.ColorRepresentation = TONE.white, rot: V3 = [0, 0, 0], ink: InkWeight | null = 'thin'): void {
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
    add(UNIT_BOX, M.weathered, t, { at: [0, 0.06, 0], scale: [0.012, 0.16, 0.008] });
    const face = add(new THREE.BoxGeometry(0.13, 0.05, 0.008), [M.weathered, M.weathered, M.weathered, M.weathered, textured(label([{ text, size: 40, color: '#3a2a1a' }], '#e7d5b0', 256, 96)), M.weathered], t, { at: [0, 0.15, 0.002] });
    face.castShadow = true;
  }
  return { season, r, b, k, lidHooks, steam, steamBase, toolSwing, spigot, root, white, whiteShiny, M, areas, picks, area, pick, inst, tag, s };
}

export type GardenCtx = ReturnType<typeof createCtx>;
