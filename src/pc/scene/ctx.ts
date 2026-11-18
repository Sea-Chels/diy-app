import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { outline, toon, type InkWeight } from '../../shared/toon';
import type { Setup } from '../data/setup';
import type { PartId } from '../data/parts';
import { K, FEET, DIMS, ATX, ITX } from './layout';
import { C } from './kit';

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

  const hotspots = new Map<PartId, THREE.Mesh[]>();
  const beacons = new Map<PartId, THREE.Mesh>();
  const rgbMats: { mat: THREE.MeshToonMaterial; phase: number }[] = [];
  const coolantMats: THREE.MeshToonMaterial[] = [];
  type Boost = 'case' | 'cooler' | 'gpu';
  const rotors: { obj: THREE.Object3D; speed: number; boost: Boost }[] = [];
  const boost: Record<Boost, number> = { case: 0, cooler: 0, gpu: 0 };

  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, ink: InkWeight | null = 'thin'): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (ink) outline(m, ink);
    parent.add(m);
    return m;
  }
  function rbox(w: number, h: number, d: number, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, r = 2, ink: InkWeight | null = 'thin'): THREE.Mesh {
    const rr = Math.max(0.05, Math.min(r, Math.min(w, h, d) / 2 - 0.05));
    return mesh(new RoundedBoxGeometry(w, h, d, 2, rr), mat, parent, x, y, z, ink);
  }
  /** Cylinder lying along x (perpendicular to the motherboard). */
  function cylX(r: number, len: number, mat: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number, seg = 32, ink: InkWeight | null = 'thin'): THREE.Mesh {
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    g.rotateZ(Math.PI / 2);
    return mesh(g, mat, parent, x, y, z, ink);
  }
  function hot(part: PartId, ...meshes: THREE.Object3D[]): void {
    const list = hotspots.get(part) ?? [];
    for (const o of meshes) {
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh || m.userData.ink) return;
        m.userData.area = part;
        list.push(m);
      });
    }
    hotspots.set(part, list);
  }
  function rgb(phase: number): THREE.MeshToonMaterial {
    const m = toon(0x3a3d48, { halftone: 0 });
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
      mesh(fg, mats.fanFrame, g);
    }
    const rotor = new THREE.Group();
    g.add(rotor);
    const hub = new THREE.CylinderGeometry(size * 0.16, size * 0.16, 16, 28);
    hub.rotateX(Math.PI / 2);
    mesh(hub, mats.hub, rotor);
    const n = 7;
    const bladeGeo = new RoundedBoxGeometry(size * 0.3, size * 0.15, 1.8, 1, 0.8);
    for (let i = 0; i < n; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.z = (i / n) * Math.PI * 2;
      rotor.add(pivot);
      const b = mesh(bladeGeo, mats.blade, pivot, size * 0.31, 0, 0);
      b.rotation.x = 0.5;
      b.rotation.z = 0.18;
    }
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
    slot: toon(C.slot),
    black: toon(C.black, { shine: 0.2 }),
    plastic: toon(C.plastic, { shine: 0.3 }),
    metal: toon(C.metal, { shine: 0.7, metal: 0.6 }),
    darkMetal: toon(C.darkMetal, { shine: 0.5, metal: 0.4 }),
    copper: toon(C.copper, { shine: 0.8, metal: 0.6 }),
    sleeve: toon(C.sleeve, { shine: 0.15 }),
    ihs: toon(C.ihs, { shine: 0.8, metal: 0.5 }),
    ramBody: toon(C.ramBody, { shine: 0.45, metal: 0.2 }),
    gpu: toon(C.gpu, { shine: 0.4 }),
    fanFrame: toon(0x24252d, { shine: 0.25 }),
    hub: toon(0x2f3240, { shine: 0.4 }),
    blade: toon(C.blade, { shine: 0.3 }),
    m2: toon(C.m2, { shine: 0.2 }),
    paste: toon(0x9aa0ab, { shine: 0.5 }),
  };
  return { dm, W, H, D, L, loop, root, cg, hotspots, beacons, rgbMats, coolantMats, rotors, boost, mesh, rbox, cylX, hot, rgb, coolant, fan, mats, s };
}

export type PcCtx = ReturnType<typeof createCtx>;
