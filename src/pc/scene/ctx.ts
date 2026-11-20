import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon } from '../../shared/toon';
import { add, box, merge, type MeshOpts, type Rounding } from '../../shared/scene/kit';
import type { Setup } from '../data/setup';
import type { PartId } from '../data/parts';
import { K, FEET, DIMS, ATX, ITX } from './layout';
import { C } from './kit';
import { TONE } from '../../shared/theme';
import { tagOf } from '../../shared/scene/sceneTags';
import { createHotspots } from '../../shared/scene/rigKit';

const MM: Rounding = { segments: 2, margin: 0.05, least: 0.05 };

export function createCtx(s: Setup) {
  const dm = DIMS[s.size];
  const { W, H, D } = dm;
  const L = s.size === 'itx' ? ITX : ATX;
  const loop = s.cooling === 'loop' && s.size !== 'itx';

  const root = new THREE.Group();
  root.scale.setScalar(K);
  const cg = new THREE.Group(); // case-local coordinates: floor of the case at y=0
  cg.position.y = FEET;
  root.add(cg);

  const { hotspots, add: addHot } = createHotspots<PartId>();
  const rgbMats: { mat: THREE.MeshToonMaterial; phase: number }[] = [];
  const coolantMats: THREE.MeshToonMaterial[] = [];
  type Boost = 'case' | 'cooler' | 'gpu';
  const rotors: { obj: THREE.Object3D; speed: number; boost: Boost }[] = [];
  const boost: Record<Boost, number> = { case: 0, cooler: 0, gpu: 0 };

  /** A rounded box in millimeters, 2 mm round unless `r` says otherwise. */
  const rbox = (w: number, h: number, d: number, mat: THREE.Material, parent: THREE.Object3D, o: MeshOpts & { r?: number } = {}) => box(w, h, d, mat, parent, { ...o, r: o.r ?? 2 }, MM);
  /** Cylinder lying along x (perpendicular to the motherboard). */
  function cylX(r: number, len: number, mat: THREE.Material, parent: THREE.Object3D, o: MeshOpts & { seg?: number } = {}): THREE.Mesh {
    const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? 32);
    g.rotateZ(Math.PI / 2);
    return add(g, mat, parent, o);
  }
  /** Makes every mesh under `objs` (but their ink) the part's hotspots. */
  function hot(part: PartId, ...objs: THREE.Object3D[]): void {
    const found: THREE.Mesh[] = [];
    for (const o of objs) {
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !tagOf(c, 'ink')) found.push(c as THREE.Mesh);
      });
    }
    addHot(part, ...found);
  }
  function rgb(phase: number): THREE.MeshToonMaterial {
    const m = toon(TONE.graphite, { halftone: 0 });
    rgbMats.push({ mat: m, phase });
    return m;
  }
  function coolant(): THREE.MeshToonMaterial {
    const m = toon(s.rgbColor, { shine: 0.8, halftone: 0.4, emissive: s.rgbColor, emissiveIntensity: 0.35 });
    coolantMats.push(m);
    return m;
  }

  /** A fan facing +z: frame (optional), hub, blades and an optional RGB ring. */
  function fan(size: number, parent: THREE.Object3D, o: { frame?: boolean; ring?: boolean; boost: Boost; phase?: number; speed?: number }): THREE.Group {
    const g = new THREE.Group();
    parent.add(g);
    if (o.frame !== false) {
      const sh = new THREE.Shape();
      const r = 9;
      const h = size / 2;
      sh.moveTo(-h + r, -h);
      sh.lineTo(h - r, -h);
      sh.quadraticCurveTo(h, -h, h, -h + r);
      sh.lineTo(h, h - r);
      sh.quadraticCurveTo(h, h, h - r, h);
      sh.lineTo(-h + r, h);
      sh.quadraticCurveTo(-h, h, -h, h - r);
      sh.lineTo(-h, -h + r);
      sh.quadraticCurveTo(-h, -h, -h + r, -h);
      const hole = new THREE.Path();
      hole.absarc(0, 0, size * 0.47, 0, Math.PI * 2, true);
      sh.holes.push(hole);
      const fg = new THREE.ExtrudeGeometry(sh, { depth: 25, bevelEnabled: false, curveSegments: 24 });
      fg.translate(0, 0, -12.5);
      add(fg, mats.fanFrame, g);
    }
    // Hub and blades as one mesh (one draw per material, one ink hull), which spins as the rotor.
    const rotor = new THREE.Group();
    g.add(rotor);
    const hub = new THREE.CylinderGeometry(size * 0.16, size * 0.16, 16, 28);
    hub.rotateX(Math.PI / 2);
    const n = 7;
    const bladeGeo = new RoundedBoxGeometry(size * 0.3, size * 0.15, 1.8, 1, 0.8);
    const pitch = new THREE.Matrix4().compose(new THREE.Vector3(size * 0.31, 0, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0, 0.18)), new THREE.Vector3(1, 1, 1));
    const blades = Array.from({ length: n }, (_, i) => bladeGeo.clone().applyMatrix4(new THREE.Matrix4().makeRotationZ((i / n) * Math.PI * 2).multiply(pitch)));
    add(merge([hub.toNonIndexed(), merge(blades)], true), [mats.hub, mats.blade], rotor);
    if (o.ring) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.47, 2.4, 8, 64), rgb(o.phase ?? 0));
      ring.position.z = 12.6;
      g.add(ring);
    }
    rotors.push({ obj: rotor, speed: o.speed ?? 7, boost: o.boost });
    return g;
  }

  const mats = {
    case: toon(s.caseColor, { shine: 0.35 }),
    inner: toon(new THREE.Color(s.caseColor).multiplyScalar(0.62), { shine: 0.1 }),
    pcb: toon(C.pcb, { shine: 0.2 }),
    slot: toon(TONE.cover),
    black: toon(TONE.blackPart, { shine: 0.2 }),
    plastic: toon(TONE.plastic, { shine: 0.3 }),
    metal: toon(TONE.silver, { shine: 0.7, metal: 0.6 }),
    darkMetal: toon(C.darkMetal, { shine: 0.5, metal: 0.4 }),
    copper: toon(C.copper, { shine: 0.8, metal: 0.6 }),
    sleeve: toon(TONE.blackPart, { shine: 0.15 }),
    ihs: toon(TONE.polished, { shine: 0.8, metal: 0.5 }),
    ramBody: toon(TONE.cover, { shine: 0.45, metal: 0.2 }),
    gpu: toon(TONE.plastic, { shine: 0.4 }),
    fanFrame: toon(TONE.charcoal, { shine: 0.25 }),
    hub: toon(TONE.cover, { shine: 0.4 }),
    blade: toon(TONE.graphite, { shine: 0.3 }),
    m2: toon(C.m2, { shine: 0.2 }),
    paste: toon(TONE.alloy, { shine: 0.5 }),
  };
  return { dm, W, H, D, L, loop, root, cg, hotspots, rgbMats, coolantMats, rotors, boost, rbox, cylX, hot, rgb, coolant, fan, mats, s };
}

export type PcCtx = ReturnType<typeof createCtx>;
