/**
 * Stylized comic-book PC: a glass-sided case with a motherboard, CPU, cooler
 * (air, AIO or custom loop), RAM, GPU, drives and PSU, plus a monitor that
 * shows POST, the BIOS and an OS install. Modelled in millimetres and scaled
 * down; the contract with the scene is `Rig`. Every PartId in data/parts.ts
 * gets hotspot meshes, a beacon and a camera view.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LidId, PartId } from '../data/parts';
import type { Setup } from '../data/setup';
import { tween, easeInOutCubic, lerp } from '../../shared/tween';
import { disposeTree, glass, inkLine, outline, toon, type InkWeight } from '../../shared/toon';
import { createScreen, type Specs } from './screen';

type V3 = [number, number, number];

export interface View {
  pos: V3;
  target: V3;
}

export interface Rig {
  /** Rebuild when this changes; colours and RGB update in place. */
  key: string;
  group: THREE.Group;
  hotspots: Map<PartId, THREE.Mesh[]>;
  beacons: Map<PartId, THREE.Mesh>;
  views: Record<PartId, View>;
  overview: View;
  setLid(lid: LidId, open: boolean): void;
  isLidOpen(lid: LidId): boolean;
  setLook(s: Setup): void;
  setSpecs(s: Specs): void;
  /** The scene tells the rig what's selected so the monitor can follow along. */
  focus(part: PartId | null): void;
  /** Play a part's small animation, if it has one. */
  poke(part: PartId): void;
  update(t: number): void;
  dispose(): void;
}

export const rigKey = (s: Setup) => `${s.size}|${s.cooling}|${s.gpu}`;

/** Millimetres to scene units. */
const K = 0.005;
/** Case panel thickness. */
const T = 6;
const FEET = 14;

interface Dims {
  W: number;
  H: number;
  D: number;
  /** Cable space behind the motherboard tray. */
  gap: number;
  board: { w: number; h: number };
  boardRear: number;
  boardTop: number;
  shroud: number | null;
  front: { n: number; size: number };
  top: { n: number; size: number };
  rear: number | null;
  rad: number;
}

const DIMS: Record<Setup['size'], Dims> = {
  itx: { W: 185, H: 292, D: 376, gap: 14, board: { w: 170, h: 170 }, boardRear: 8, boardTop: 45, shroud: null, front: { n: 0, size: 120 }, top: { n: 2, size: 120 }, rear: null, rad: 240 },
  mid: { W: 215, H: 465, D: 440, gap: 26, board: { w: 244, h: 305 }, boardRear: 10, boardTop: 50, shroud: 100, front: { n: 3, size: 120 }, top: { n: 2, size: 120 }, rear: 120, rad: 360 },
  full: { W: 240, H: 560, D: 520, gap: 30, board: { w: 244, h: 305 }, boardRear: 15, boardTop: 70, shroud: 125, front: { n: 3, size: 140 }, top: { n: 3, size: 120 }, rear: 140, rad: 360 },
};

/** Motherboard feature positions: u runs from the rear edge toward the front, v down from the top edge. */
interface Layout {
  socket: [number, number];
  ram: { u0: number; n: number; v0: number; v1: number; fill: number[] };
  pcie: number[];
  m2: [number, number, number];
  cmos: [number, number];
  atx24: [number, number, number];
  eps: [number, number];
  chipset: [number, number, number, number] | null;
  io: [number, number];
  vrmTop: [number, number, number];
  vrmSide: [number, number, number];
  sata: [number, number] | null;
}

const ATX: Layout = {
  socket: [105, 88],
  ram: { u0: 172, n: 4, v0: 12, v1: 145, fill: [1, 3] },
  pcie: [192, 258],
  m2: [48, 138, 160],
  cmos: [206, 284],
  atx24: [237, 110, 162],
  eps: [34, 9],
  chipset: [172, 226, 200, 250],
  io: [8, 165],
  vrmTop: [45, 145, 17],
  vrmSide: [38, 30, 125],
  sata: [238, 195],
};

const ITX: Layout = {
  socket: [80, 62],
  ram: { u0: 140, n: 2, v0: 8, v1: 141, fill: [0, 1] },
  pcie: [152],
  m2: [25, 105, 118],
  cmos: [124, 124],
  atx24: [163, 20, 72],
  eps: [30, 7],
  chipset: null,
  io: [8, 140],
  vrmTop: [42, 102, 14],
  vrmSide: [32, 30, 95],
  sata: null,
};

const C = {
  pcb: 0x1e2433,
  trace: 0x3a4870,
  slot: 0x2c303d,
  black: 0x18171e,
  plastic: 0x2b2d36,
  metal: 0xb7bfcf,
  darkMetal: 0x4a5061,
  copper: 0xd88a4f,
  sleeve: 0x1f1e27,
  ihs: 0xd3d8e2,
  ramBody: 0x30333f,
  gpu: 0x2a2c36,
  blade: 0x3a3e4c,
  label: 0xeceaf2,
  beacon: 0x6ee7ff,
  m2: 0x1d3b30,
};

// ---------- canvas textures ----------

function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** Light/dark bands: radiator and heatsink fins. */
const stripes = (repeat: [number, number], light = '#c9cfdc', dark = '#5b6274') =>
  canvasTex(16, 4, (ctx) => {
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 16, 4);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, 5, 4);
  }, repeat);

/** Front mesh: dark sheet with transparent holes so the fans' glow shows through. */
const perforated = (repeat: [number, number]) =>
  canvasTex(32, 32, (ctx) => {
    ctx.fillStyle = 'rgba(14,13,20,0.86)';
    ctx.fillRect(0, 0, 32, 32);
    ctx.globalCompositeOperation = 'destination-out';
    for (const [x, y] of [[8, 8], [24, 24], [24, 8], [8, 24]]) {
      ctx.beginPath();
      ctx.arc(x, y, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat);

function label(lines: { text: string; size: number; color?: string; weight?: number }[], bg: string, w = 256, h = 128): THREE.CanvasTexture {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const total = lines.reduce((s, l) => s + l.size * 1.15, 0);
    let y = (h - total) / 2;
    for (const l of lines) {
      ctx.font = `${l.weight ?? 800} ${l.size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = l.color ?? '#16111f';
      ctx.fillText(l.text, w / 2, y);
      y += l.size * 1.15;
    }
  });
}

function mapped(color: THREE.ColorRepresentation, map: THREE.Texture, o: Parameters<typeof toon>[1] = {}): THREE.MeshToonMaterial {
  const m = toon(color, o);
  m.map = map;
  return m;
}

// ---------- hard-tube paths with rounded bends ----------

function bentPath(pts: THREE.Vector3[], bend = 14): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  let from = pts[0].clone();
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (i === pts.length - 1) {
      path.add(new THREE.LineCurve3(from, p.clone()));
      break;
    }
    const next = pts[i + 1];
    const inDir = p.clone().sub(pts[i - 1]).normalize();
    const outDir = next.clone().sub(p).normalize();
    const r = Math.min(bend, p.distanceTo(pts[i - 1]) / 2, p.distanceTo(next) / 2);
    const a = p.clone().addScaledVector(inDir, -r);
    const b = p.clone().addScaledVector(outDir, r);
    path.add(new THREE.LineCurve3(from, a));
    path.add(new THREE.QuadraticBezierCurve3(a, p.clone(), b));
    from = b;
  }
  return path;
}

export function buildRig(s: Setup): Rig {
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

  // ---------- helpers ----------
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
        m.userData.part = part;
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

  // ---------- materials ----------
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

  // ---------- case shell ----------
  const trayX = W / 2 - dm.gap;
  const innerX0 = -W / 2 + T;
  const innerCx = (innerX0 + trayX) / 2;
  const right = rbox(T, H, D, mats.case, cg, W / 2 - T / 2, H / 2, 0, 3, 'body');
  const top = rbox(W, T, D, mats.case, cg, 0, H - T / 2, 0, 3, 'body');
  const bottom = rbox(W, T, D, mats.case, cg, 0, T / 2, 0, 3, 'body');
  const rear = rbox(W, H, T, mats.case, cg, 0, H / 2, -D / 2 + T / 2, 2, 'body');
  hot('case', right, top, bottom, rear);
  rbox(2, H - 2 * T, D - 2 * T, mats.inner, cg, trayX + 1, H / 2, 0, 0.5, null); // motherboard tray

  // Front: a frame round a perforated mesh you can see the fans through.
  const fz = D / 2 - T / 2;
  const fb = 18;
  const frontBars = [
    rbox(fb, H, T, mats.case, cg, -W / 2 + fb / 2, H / 2, fz, 2, 'body'),
    rbox(fb, H, T, mats.case, cg, W / 2 - fb / 2, H / 2, fz, 2, 'body'),
    rbox(W, 24, T, mats.case, cg, 0, H - 12, fz, 2, 'body'),
    rbox(W, 24, T, mats.case, cg, 0, 12, fz, 2, 'body'),
  ];
  hot('case', ...frontBars);
  const frontMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 2 * fb, H - 48),
    new THREE.MeshBasicMaterial({ map: perforated([(W - 2 * fb) / 9, (H - 48) / 9]), transparent: true, depthWrite: false }),
  );
  frontMesh.position.set(0, H / 2, D / 2 - 1);
  cg.add(frontMesh);

  // Feet
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    mesh(new THREE.CylinderGeometry(11, 13, FEET, 20), mats.black, root, x * (W / 2 - 22), FEET / 2, z * (D / 2 - 30));
  }

  // Top vent over the fans or radiator.
  const vent = rbox(W - 50, 1.6, D * 0.62, mapped(0x9aa0ab, stripes([1, 34], '#3b3f4c', '#1a1b22')), cg, -8, H + 0.6, -D * 0.12, 0.6, null);
  hot('case', vent);

  // Rear: I/O cutout, slot covers, a fan grille.
  const rz = -D / 2 - 0.7;
  // (Positions use the motherboard geometry computed below; hoisted constants.)
  const bw = dm.board.w;
  const bh = dm.board.h;
  const boardRear = -D / 2 + T + dm.boardRear;
  const boardTop = H - T - dm.boardTop;
  const boardFace = trayX - 8.6;
  const P = (u: number, v: number, dx: number) => new THREE.Vector3(boardFace - dx, boardTop - v, boardRear + u);
  rbox(W * 0.32, L.io[1] - L.io[0], 1.4, mats.black, cg, boardFace - W * 0.16 + 4, boardTop - (L.io[0] + L.io[1]) / 2, rz, 0.5, null);
  for (let i = 0; i < (s.size === 'itx' ? 2 : 7); i++) {
    rbox(W * 0.62, 9, 1.4, mats.darkMetal, cg, innerCx, boardTop - L.pcie[0] - 4 - i * 20.3, rz, 0.5, null);
  }
  if (dm.rear) {
    const ry = boardTop - 20 - dm.rear / 2;
    const rx = boardFace - 25 - dm.rear / 2;
    const ringPts = Array.from({ length: 49 }, (_, i) => new THREE.Vector3(rx + Math.cos((i / 48) * Math.PI * 2) * dm.rear! * 0.46, ry + Math.sin((i / 48) * Math.PI * 2) * dm.rear! * 0.46, rz - 0.4));
    cg.add(inkLine(ringPts, 2));
  }

  // Glass side panel, hinged on its rear edge.
  const glassPivot = new THREE.Group();
  glassPivot.position.set(-W / 2, 0, -D / 2);
  cg.add(glassPivot);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(D - 4, H - 4), glass({ tint: 0x1d1b3a, streak: 0xd9d2ff, alpha: 0.08, streaks: 0.4 }));
  pane.rotation.y = -Math.PI / 2;
  pane.position.set(-1.5, H / 2, D / 2);
  pane.renderOrder = 2;
  glassPivot.add(pane);
  const trim = [
    rbox(4, 12, D, mats.black, glassPivot, -1.5, H - 6, D / 2, 1.5),
    rbox(4, 12, D, mats.black, glassPivot, -1.5, 6, D / 2, 1.5),
    rbox(4, H, 12, mats.black, glassPivot, -1.5, H / 2, 6, 1.5),
    rbox(4, H, 12, mats.black, glassPivot, -1.5, H / 2, D - 6, 1.5),
  ];
  hot('case', ...trim);
  for (const y of [H * 0.2, H * 0.8]) cylX(5, 6, mats.metal, glassPivot, -5, y, 6, 16);

  // Front I/O on the top panel: power button, USB, audio.
  const ioz = D / 2 - 26;
  const ioPlate = rbox(W * 0.62, 2.4, 30, mats.black, cg, -W / 2 + W * 0.36, H + 1.2, ioz, 1);
  const btnX = -W / 2 + 24;
  const btn = mesh(new THREE.CylinderGeometry(9, 9, 4, 28), mats.metal, cg, btnX, H + 2.6, ioz);
  const ledMat = toon(0x3a3d48, { halftone: 0, emissive: 0x6ee7ff, emissiveIntensity: 1 });
  const led = new THREE.Mesh(new THREE.TorusGeometry(9.6, 1.1, 8, 40), ledMat);
  led.rotation.x = Math.PI / 2;
  led.position.set(btnX, H + 4.4, ioz);
  cg.add(led);
  hot('power', ioPlate, btn, led);
  const usbXs = [btnX + 26, btnX + 42];
  for (const x of usbXs) rbox(13, 1.2, 5, mats.slot, cg, x, H + 2.6, ioz, 0.4, null);
  rbox(9, 1.2, 3.4, mats.slot, cg, btnX + 56, H + 2.6, ioz, 1, null);
  mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 16), mats.slot, cg, btnX + 68, H + 2.6, ioz, null);
  // Installer USB stick: pops into the first port while the BIOS or an install is on screen.
  const usb = new THREE.Group();
  usb.position.set(usbXs[0], H + 2, ioz);
  usb.scale.setScalar(0.001);
  cg.add(usb);
  rbox(12, 12, 4.6, mats.metal, usb, 0, 6, 0, 0.6);
  rbox(17, 34, 7, toon(0xffd23f, { shine: 0.5 }), usb, 0, 27, 0, 3);
  hot('monitor', usb);

  // ---------- motherboard ----------
  const pcb = rbox(1.6, bh, bw, mats.pcb, cg, boardFace + 0.8, boardTop - bh / 2, boardRear + bw / 2, 0.7);
  hot('motherboard', pcb);
  const traceLines: [number, number][][] = [
    [[L.socket[0] + 32, L.socket[1]], [L.ram.u0 - 6, L.socket[1]], [L.ram.u0 - 6, L.ram.v0 + 20]],
    [[L.socket[0], L.socket[1] + 32], [L.socket[0], L.pcie[0] - 10], [20, L.pcie[0] - 10]],
    [[L.socket[0] + 20, L.socket[1] + 32], [L.socket[0] + 20, L.m2[2] - 14], [L.m2[1] + 6, L.m2[2] - 14]],
    [[L.ram.u0 + L.ram.n * 9 + 6, L.ram.v1 + 6], [bw - 18, L.ram.v1 + 6], [bw - 18, bh - 30]],
    [[L.socket[0] - 30, L.socket[1] + 10], [L.vrmSide[0] + 16, L.socket[1] + 10]],
    [[60, bh - 12], [bw * 0.7, bh - 12]],
  ];
  for (const pts of traceLines) cg.add(inkLine(pts.map(([u, v]) => P(u, v, 0.4)), 1.4, C.trace));

  const mb: THREE.Object3D[] = [];
  const ioc = P(15, (L.io[0] + L.io[1]) / 2, 11);
  mb.push(rbox(22, L.io[1] - L.io[0], 30, mats.darkMetal, cg, ioc.x, ioc.y, ioc.z, 3, 'body'));
  const ioRgb = new THREE.Mesh(new RoundedBoxGeometry(1.6, (L.io[1] - L.io[0]) * 0.6, 3, 1, 0.5), rgb(0.1));
  ioRgb.position.copy(P(15, (L.io[0] + L.io[1]) / 2, 22.6));
  cg.add(ioRgb);
  const [vt0, vt1, vtv] = L.vrmTop;
  const vtp = P((vt0 + vt1) / 2, vtv, 10);
  const vrmTex = () => mapped(C.metal, stripes([1, 10]), { shine: 0.6, metal: 0.5 });
  mb.push(rbox(20, 22, vt1 - vt0, vrmTex(), cg, vtp.x, vtp.y, vtp.z, 2.5, 'body'));
  const [vsu, vs0, vs1] = L.vrmSide;
  const vsp = P(vsu, (vs0 + vs1) / 2, 10);
  mb.push(rbox(20, vs1 - vs0, 16, vrmTex(), cg, vsp.x, vsp.y, vsp.z, 2.5, 'body'));
  // 24-pin and CPU 8-pin power sockets.
  const a24 = P(L.atx24[0], (L.atx24[1] + L.atx24[2]) / 2, 7);
  mb.push(rbox(14, L.atx24[2] - L.atx24[1], 9, mats.black, cg, a24.x, a24.y, a24.z, 1));
  const eps = P(L.eps[0], L.eps[1], 6);
  mb.push(rbox(12, 9, 19, mats.black, cg, eps.x, eps.y, eps.z, 1));
  // PCIe slots (the top one armoured).
  L.pcie.forEach((v, i) => {
    const p = P(49, v, 4.5);
    mb.push(rbox(9, 7, 89, i === 0 ? mats.metal : mats.slot, cg, p.x, p.y, p.z, 1));
  });
  if (L.chipset) {
    const [u0, u1, v0, v1] = L.chipset;
    const p = P((u0 + u1) / 2, (v0 + v1) / 2, 6);
    const chip = rbox(12, v1 - v0, u1 - u0, mapped(0xffffff, label([{ text: 'DIY', size: 64, color: '#eef0f4' }, { text: 'B650', size: 30, color: '#6ee7ff' }], '#3c4252')), cg, p.x, p.y, p.z, 3, 'body');
    mb.push(chip);
  }
  if (L.sata) {
    for (let i = 0; i < 4; i++) {
      const p = P(L.sata[0], L.sata[1] + i * 10, 4);
      mb.push(rbox(8, 7, 7, mats.black, cg, p.x, p.y, p.z, 0.8));
    }
  }
  const fp = P(bw * 0.82, bh - 6, 3.5);
  mb.push(rbox(7, 6, 30, mats.black, cg, fp.x, fp.y, fp.z, 0.8));
  hot('motherboard', ...mb);

  // CPU socket, CPU and a dot of paste (seen when the cooler lifts away).
  const [su, sv] = L.socket;
  const sk = P(su, sv, 0);
  const cpuParts = [
    rbox(4, 60, 60, mats.metal, cg, sk.x - 2, sk.y, sk.z, 1.5),
    rbox(4, 42, 42, mats.ihs, cg, sk.x - 5.5, sk.y, sk.z, 2),
    cylX(7.5, 1.4, mats.paste, cg, sk.x - 8, sk.y, sk.z, 24),
  ];
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(7, 0), new THREE.Vector2(0, 7)]);
  const triMesh = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshBasicMaterial({ color: 0xd9b45a }));
  triMesh.rotation.y = -Math.PI / 2;
  triMesh.position.set(sk.x - 7.6, sk.y - 19, sk.z - 19);
  cg.add(triMesh);
  hot('cpu', ...cpuParts);

  // RAM slots and sticks.
  const ramSticks: THREE.Group[] = [];
  const ramParts: THREE.Object3D[] = [];
  const ramMid = (L.ram.v0 + L.ram.v1) / 2;
  const ramLen = L.ram.v1 - L.ram.v0;
  for (let i = 0; i < L.ram.n; i++) {
    const u = L.ram.u0 + i * 9;
    const p = P(u, ramMid, 3.5);
    ramParts.push(rbox(7, ramLen + 8, 6, mats.slot, cg, p.x, p.y, p.z, 1));
    if (!L.ram.fill.includes(i)) continue;
    const stick = new THREE.Group();
    stick.position.copy(P(u, ramMid, 0));
    cg.add(stick);
    ramParts.push(rbox(34, ramLen - 4, 7, mats.ramBody, stick, -24, 0, 0, 1.5, 'body'));
    ramParts.push(rbox(16, ramLen - 4, 1.4, mats.m2, stick, -7, 0, 0, 0.5));
    const bar = new THREE.Mesh(new RoundedBoxGeometry(6, ramLen - 10, 6.4, 1, 1.5), rgb(0.3 + i * 0.08));
    bar.position.set(-43.5, 0, 0);
    stick.add(bar);
    ramParts.push(bar);
    ramSticks.push(stick);
  }
  hot('ram', ...ramParts);

  // M.2 drive under its heatsink.
  const [m0, m1, mv] = L.m2;
  const m2c = P((m0 + m1) / 2, mv, 0);
  const m2Stick = rbox(1.2, 22, m1 - m0 - 4, mats.m2, cg, m2c.x - 2.2, m2c.y, m2c.z, 0.4);
  const m2Chips = [
    rbox(1.6, 15, 14, mats.black, cg, m2c.x - 3.4, m2c.y, m2c.z - 18, 0.5),
    rbox(1.6, 15, 22, mats.black, cg, m2c.x - 3.4, m2c.y, m2c.z + 12, 0.5),
  ];
  const sinkG = new THREE.Group();
  cg.add(sinkG);
  const sink = rbox(8, 27, m1 - m0 + 6, mapped(0x9aa3b4, stripes([16, 1], '#aeb5c4', '#6b7284'), { shine: 0.6, metal: 0.5 }), sinkG, m2c.x - 8, m2c.y, m2c.z, 2.5, 'body');
  hot('m2', m2Stick, ...m2Chips, sink);

  // CMOS battery
  const cmosG = new THREE.Group();
  const cm = P(L.cmos[0], L.cmos[1], 0);
  cmosG.position.copy(cm);
  cg.add(cmosG);
  const cmosParts = [cylX(11.5, 3, mats.black, cmosG, -1.5, 0, 0, 28), cylX(10, 3.2, mats.metal, cmosG, -4, 0, 0, 28)];
  hot('cmos', ...cmosParts);

  // ---------- graphics card ----------
  const slotY = boardTop - L.pcie[0];
  const gpuG = new THREE.Group();
  cg.add(gpuG);
  let gpuDims: { len: number; hx: number; t: number; cx: number; z0: number } | null = null;
  if (s.gpu !== 'none') {
    const big = s.gpu === 'triple';
    const len = big ? 322 : 272;
    const hx = big ? 136 : 118;
    const t = loop ? 28 : big ? 58 : 42;
    const cx = boardFace - 2 - hx / 2;
    const z0 = -D / 2 + T + 1;
    gpuDims = { len, hx, t, cx, z0 };
    const yTop = slotY + 2;
    const gp: THREE.Object3D[] = [];
    gp.push(rbox(hx, t, len, loop ? mats.darkMetal : mats.gpu, gpuG, cx, yTop - t / 2, z0 + len / 2, loop ? 4 : 7, 'body'));
    gp.push(rbox(hx - 2, 3.6, len - 6, mats.darkMetal, gpuG, cx, yTop + 1.8, z0 + len / 2, 1.4));
    gp.push(rbox(hx * 0.92, t + 10, 1.6, mats.metal, gpuG, cx + 2, yTop - t / 2 + 2, -D / 2 + T + 0.6, 0.6));
    const side = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.42, t * 0.52), new THREE.MeshBasicMaterial({ map: label([{ text: 'DIY GAMING', size: 52, color: '#eef0f4' }], '#2a2c36', 512, 96) }));
    side.rotation.y = -Math.PI / 2;
    side.position.set(cx - hx / 2 - 0.3, yTop - t * 0.55, z0 + len * 0.36);
    gpuG.add(side);
    gp.push(side);
    const strip = new THREE.Mesh(new RoundedBoxGeometry(2, 5, len * 0.32, 1, 0.8), rgb(0.55));
    strip.position.set(cx - hx / 2 - 0.6, yTop - t * 0.55, z0 + len * 0.76);
    gpuG.add(strip);
    gp.push(strip);
    if (loop) {
      const ch = rbox(2.4, t * 0.5, len * 0.7, coolant(), gpuG, cx - hx / 2 - 0.4, yTop - t / 2, z0 + len * 0.45, 1, null);
      gp.push(ch);
    } else {
      const n = big ? 3 : 2;
      const d = big ? 96 : 98;
      for (let i = 0; i < n; i++) {
        const z = z0 + (len / n) * (i + 0.5);
        const well = mesh(new THREE.CylinderGeometry(d / 2 + 3, d / 2 + 3, 2, 40), mats.black, gpuG, cx, yTop - t - 0.4, z, null);
        gp.push(well);
        const f = fan(d, gpuG, { frame: false, boost: 'gpu', speed: 0 });
        f.rotation.x = Math.PI / 2;
        f.position.set(cx, yTop - t - 9, z);
        gp.push(f);
      }
    }
    // Power socket and its cable to the PSU.
    const sp = new THREE.Vector3(cx - hx / 2 + 26, yTop + 9, z0 + len * 0.86);
    gp.push(rbox(20, 10, 24, mats.black, gpuG, sp.x, sp.y, sp.z, 1));
    hot('gpu', ...gp);
  }

  // ---------- cooling ----------
  const coolerG = new THREE.Group();
  cg.add(coolerG);
  const cl: THREE.Object3D[] = [];
  const radL = dm.rad;
  const radX = innerX0 + 4 + 60;
  const radY = H - T - 16;
  const radZ0 = s.size === 'itx' ? boardRear : -D / 2 + T + 8;
  const radZ1 = radZ0 + radL;
  let aioTubes: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  const loopCpuTubes: THREE.Mesh[] = [];

  function radiator(): void {
    const core = rbox(120, 27, radL - 28, mapped(0xb7bdcc, stripes([1, radL / 4], '#9aa1b2', '#2b2f3a'), { shine: 0.3 }), cg, radX, radY, (radZ0 + radZ1) / 2, 1.5, 'body');
    const tanks = [radZ0 + 7, radZ1 - 7].map((z) => rbox(124, 31, 14, mats.darkMetal, cg, radX, radY, z, 3, 'body'));
    cl.push(core, ...tanks);
    const n = Math.floor((radL - 20) / 120);
    for (let i = 0; i < n; i++) {
      const f = fan(118, cg, { ring: s.rgb !== 'off', boost: 'cooler', phase: i * 0.12 });
      f.rotation.x = -Math.PI / 2;
      f.position.set(radX, radY - 13.5 - 13, radZ0 + 14 + 59 + i * 120);
      cl.push(f);
    }
  }

  const coolerTop = { x: 0, y: sk.y, z: sk.z };
  if (s.cooling === 'air') {
    cl.push(rbox(8, 46, 46, mats.copper, coolerG, sk.x - 12, sk.y, sk.z, 1.5));
    for (const dz of [-15, -5, 5, 15]) cl.push(cylX(3.2, 140, mats.copper, coolerG, sk.x - 84, sk.y + (dz % 10 === 5 ? 18 : -18), sk.z + dz, 12));
    const stackLen = 108;
    const fins = rbox(stackLen, 122, 54, mapped(0xc4cad6, stripes([22, 1], '#d4d9e3', '#6f7688'), { shine: 0.5, metal: 0.4 }), coolerG, sk.x - 42 - stackLen / 2, sk.y, sk.z, 2, 'body');
    const cap = rbox(6, 126, 58, mapped(0xffffff, label([{ text: 'DIY', size: 44, color: '#16111f' }], '#d8dce6', 128, 256)), coolerG, sk.x - 153, sk.y, sk.z, 2.5, 'body');
    const f = fan(120, coolerG, { ring: s.rgb !== 'off', boost: 'cooler', phase: 0.2 });
    f.position.set(sk.x - 96, sk.y, sk.z + 27 + 13);
    cl.push(fins, cap, f);
    coolerTop.x = sk.x - 156;
  } else if (s.cooling === 'aio' || s.size === 'itx') {
    cl.push(cylX(34, 34, mats.darkMetal, coolerG, sk.x - 21, sk.y, sk.z, 40, 'body'));
    const capMat = mapped(0xffffff, label([{ text: 'DIY', size: 96, color: '#eef0f4' }], '#1b1a23', 256, 256));
    const capMesh = cylX(29, 3, capMat, coolerG, sk.x - 39, sk.y, sk.z, 40);
    cl.push(capMesh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(31.5, 2.8, 8, 56), rgb(0.4));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(sk.x - 39, sk.y, sk.z);
    coolerG.add(ring);
    cl.push(ring);
    radiator();
    aioTubes = [-1, 1].map((side) => {
      const m = new THREE.Mesh(new THREE.BufferGeometry(), mats.sleeve);
      m.castShadow = true;
      cg.add(m);
      cl.push(m);
      return {
        mesh: m,
        from: new THREE.Vector3(sk.x - 22, sk.y + 33, sk.z + side * 12),
        to: new THREE.Vector3(radX + side * 24, radY - 15, radZ0 + 7),
      };
    });
    coolerTop.x = sk.x - 42;
  } else {
    // Custom loop: CPU block, reservoir + pump, radiator and hard tubes.
    cl.push(rbox(24, 74, 74, mats.darkMetal, coolerG, sk.x - 16, sk.y, sk.z, 4, 'body'));
    cl.push(rbox(4, 58, 58, coolant(), coolerG, sk.x - 30, sk.y, sk.z, 2));
    for (const dy of [-20, 20]) cl.push(cylX(8, 10, mats.metal, coolerG, sk.x - 34, sk.y + dy, sk.z + 22, 20));
    radiator();
    coolerTop.x = sk.x - 40;
  }

  // Interior cable runs (sleeved): 24-pin, CPU 8-pin and GPU power to the tray grommets.
  const grommetZ = boardRear + bw + (s.size === 'itx' ? 6 : 22);
  const cable = (pts: THREE.Vector3[], r: number) => {
    const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 10), mats.sleeve, cg, 0, 0, 0);
    return m;
  };
  if (s.size !== 'itx') {
    for (const v of [70, 160, 250]) rbox(1.2, 52, 16, mats.black, cg, trayX - 0.6, boardTop - v, grommetZ, 6, null);
  }
  const a24v = (L.atx24[1] + L.atx24[2]) / 2;
  cable([P(L.atx24[0], a24v, 12), P(L.atx24[0] - 2, a24v, 30), new THREE.Vector3(boardFace - 26, boardTop - a24v, grommetZ - 8), new THREE.Vector3(trayX - 2, boardTop - a24v, grommetZ)], 9);
  cable([P(L.eps[0], L.eps[1], 10), P(L.eps[0], L.eps[1] - 16, 18), new THREE.Vector3(trayX - 4, boardTop + 26, boardRear + L.eps[0] + 30)], 5);
  if (gpuDims) {
    const { cx, hx, z0, len } = gpuDims;
    const sp = new THREE.Vector3(cx - hx / 2 + 26, slotY + 16, z0 + len * 0.86);
    const g = cable([sp, sp.clone().add(new THREE.Vector3(0, 26, 0)), new THREE.Vector3(boardFace - 40, slotY + 44, grommetZ - 12), new THREE.Vector3(trayX - 2, slotY + 44, grommetZ)], 5.5);
    gpuG.attach(g);
  }

  // ---------- PSU, shroud and drives ----------
  const shroudG = new THREE.Group();
  cg.add(shroudG);
  const psuParts: THREE.Object3D[] = [];
  const storageParts: THREE.Object3D[] = [];
  let psuC: THREE.Vector3;
  let storageC: THREE.Vector3;
  const psuLabel = () =>
    new THREE.MeshBasicMaterial({ map: label([{ text: '750W', size: 54, color: '#16111f' }, { text: '80+ GOLD', size: 26, color: '#7a5b12' }], '#f1d46b', 256, 160) });
  if (dm.shroud) {
    const sTop = dm.shroud;
    psuC = new THREE.Vector3(innerCx, T + 44, -D / 2 + T + 82);
    psuParts.push(rbox(150, 86, 160, mats.darkMetal, cg, psuC.x, psuC.y, psuC.z, 4, 'body'));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), psuLabel());
    lab.rotation.y = -Math.PI / 2;
    lab.position.set(psuC.x - 75.4, psuC.y, psuC.z);
    cg.add(lab);
    psuParts.push(lab);
    for (let i = 0; i < 4; i++) psuParts.push(rbox(26, 12, 2, mats.black, cg, psuC.x - 40 + (i % 2) * 40, psuC.y - 18 + Math.floor(i / 2) * 26, psuC.z + 80.6, 0.8, null));
    // Drive cage with two hard drives.
    const cageZ0 = psuC.z + 92;
    const cageZ1 = D / 2 - T - 46;
    storageC = new THREE.Vector3(innerCx, T + 40, (cageZ0 + cageZ1) / 2);
    const cageLen = Math.min(150, cageZ1 - cageZ0);
    // Open-sided cage: back wall and rails, so the drives show once the cover is down.
    storageParts.push(rbox(3, 74, cageLen, mats.inner, cg, storageC.x + 56, storageC.y, storageC.z, 1));
    for (const dy of [-37, 0, 37]) storageParts.push(rbox(110, 3, cageLen, mats.inner, cg, storageC.x, storageC.y + dy, storageC.z, 1));
    const hddLabel = mapped(0xffffff, label([{ text: '4 TB', size: 44, color: '#16111f' }, { text: 'HDD', size: 26, color: '#4a5061' }], '#d9dde6', 256, 128));
    for (const dy of [-18, 18]) {
      storageParts.push(rbox(100, 25, cageLen - 8, mats.darkMetal, cg, storageC.x - 2, storageC.y + dy, storageC.z, 2));
      const sticker = new THREE.Mesh(new THREE.PlaneGeometry(cageLen * 0.5, 18), hddLabel);
      sticker.rotation.y = -Math.PI / 2;
      sticker.position.set(storageC.x - 52.2, storageC.y + dy, storageC.z);
      cg.add(sticker);
      storageParts.push(sticker);
    }
    // Shroud: the top stays, the glass-side cover slides out.
    const sLen = D / 2 - T - 42 - (-D / 2 + T);
    const sz = -D / 2 + T + sLen / 2;
    const sTopPlate = rbox(trayX - innerX0, 3, sLen, mats.case, cg, innerCx, sTop - 1.5, sz, 1, 'body');
    shroudG.position.set(innerX0 + 2, T, 0);
    const sCover = rbox(3, sTop - T, sLen, mapped(0xffffff, label([{ text: 'DIY', size: 60, color: '#ffffff' }], s.caseColor, 512, 96)), shroudG, 0, (sTop - T) / 2, sz, 1, 'body');
    sCover.userData.coverColor = true;
    psuParts.push(sTopPlate, sCover);
    // 2.5" SSD on top of the shroud.
    storageParts.push(rbox(70, 7, 100, mapped(0xffffff, label([{ text: 'SSD', size: 60, color: '#eef0f4' }], '#3a3f4e')), cg, trayX - 50, sTop + 3.5, boardRear + 60, 1.5));
  } else {
    psuC = new THREE.Vector3(innerCx, H - T - 35, D / 2 - T - 56);
    psuParts.push(rbox(125, 64, 100, mats.darkMetal, cg, psuC.x, psuC.y, psuC.z, 4, 'body'));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(64, 40), psuLabel());
    lab.rotation.y = -Math.PI / 2;
    lab.position.set(psuC.x - 62.9, psuC.y, psuC.z);
    cg.add(lab);
    psuParts.push(lab);
    storageC = new THREE.Vector3(-14, 150, D / 2 - T - 8);
    storageParts.push(rbox(70, 100, 7, mapped(0xffffff, label([{ text: 'SSD', size: 60, color: '#eef0f4' }], '#3a3f4e')), cg, storageC.x, storageC.y, storageC.z, 1.5));
  }
  hot('psu', ...psuParts);
  hot('storage', ...storageParts);

  // ---------- case fans ----------
  const fanParts: THREE.Object3D[] = [];
  let fanC = new THREE.Vector3(innerCx, H / 2, D / 2 - T - 14);
  if (dm.front.n) {
    const sz = dm.front.size;
    for (let i = 0; i < dm.front.n; i++) {
      const f = fan(sz, cg, { ring: s.rgb !== 'off', boost: 'case', phase: 0.6 + i * 0.1, speed: 6 });
      f.position.set(innerCx, T + 14 + sz / 2 + i * (sz + 8), D / 2 - T - 14);
      fanParts.push(f);
    }
    fanC = new THREE.Vector3(innerCx, T + 14 + (dm.front.n * (sz + 8)) / 2, D / 2 - T - 14);
  }
  if (dm.rear) {
    const f = fan(dm.rear, cg, { ring: s.rgb !== 'off', boost: 'case', phase: 0.05, speed: 6 });
    f.position.set(boardFace - 25 - dm.rear / 2, boardTop - 20 - dm.rear / 2, -D / 2 + T + 14);
    fanParts.push(f);
  }
  if (s.cooling === 'air') {
    const sz = dm.top.size;
    for (let i = 0; i < dm.top.n; i++) {
      const f = fan(sz, cg, { ring: s.rgb !== 'off', boost: 'case', phase: 0.2 + i * 0.1, speed: 6 });
      f.rotation.x = -Math.PI / 2;
      f.position.set(radX, H - T - 14, -D / 2 + T + 10 + sz / 2 + i * (sz + 6));
      fanParts.push(f);
    }
    if (!dm.front.n) fanC = new THREE.Vector3(radX, H - T - 14, -D / 2 + T + 10 + (dm.top.n * (sz + 6)) / 2);
  }
  hot('fans', ...fanParts);
  hot('cooler', ...cl);

  // Light strip along the inside top front edge.
  const strip = new THREE.Mesh(new RoundedBoxGeometry(4, 4, D * 0.7, 1, 1), rgb(0.8));
  strip.position.set(innerX0 + 4, H - T - 4, 0);
  cg.add(strip);

  // ---------- custom loop plumbing ----------
  if (loop && dm.shroud) {
    const xT = boardFace - 75;
    const zRes = radZ1 - 9;
    const resX = xT - 40;
    const base = dm.shroud;
    const pump = mesh(new THREE.CylinderGeometry(33, 33, 50, 36), mats.black, cg, resX, base + 25, zRes, 'body');
    const resBody = mesh(new THREE.CylinderGeometry(28, 28, 150, 36), coolant(), cg, resX, base + 50 + 75, zRes, 'body');
    const resCap = mesh(new THREE.CylinderGeometry(31, 31, 10, 36), mats.darkMetal, cg, resX, base + 205, zRes, 'body');
    const loopParts: THREE.Object3D[] = [pump, resBody, resCap];
    const sy = sk.y;
    const fit = sk.z + 22;
    const pipe = (pts: THREE.Vector3[]) => {
      const m = mesh(new THREE.TubeGeometry(bentPath(pts), pts.length * 30, 6.5, 14), coolant(), cg, 0, 0, 0);
      loopParts.push(m);
      return m;
    };
    const y1 = base + 25;
    const radPortY = radY - 15;
    if (gpuDims) {
      const { z0, len, t } = gpuDims;
      const zGT = z0 + len - 34;
      const yTop = slotY + 2;
      const term = rbox(24, t + 22, 26, mats.metal, gpuG, xT, yTop - t / 2, zGT, 4);
      hot('gpu', term);
      pipe([new THREE.Vector3(resX, y1, zRes - 32), new THREE.Vector3(resX, y1, zGT), new THREE.Vector3(xT, y1, zGT), new THREE.Vector3(xT, yTop - t - 11, zGT)]);
      loopCpuTubes.push(pipe([new THREE.Vector3(xT, yTop + 11, zGT), new THREE.Vector3(xT, sy - 20, zGT), new THREE.Vector3(xT, sy - 20, fit), new THREE.Vector3(sk.x - 38, sy - 20, fit)]));
    } else {
      loopCpuTubes.push(pipe([new THREE.Vector3(resX, y1, zRes - 32), new THREE.Vector3(resX, y1, fit), new THREE.Vector3(resX, sy - 20, fit), new THREE.Vector3(sk.x - 38, sy - 20, fit)]));
    }
    loopCpuTubes.push(pipe([new THREE.Vector3(sk.x - 38, sy + 20, fit), new THREE.Vector3(xT, sy + 20, fit), new THREE.Vector3(xT, sy + 20, zRes), new THREE.Vector3(xT, radPortY, zRes)]));
    pipe([new THREE.Vector3(resX, radPortY, zRes), new THREE.Vector3(resX, base + 210, zRes)]);
    hot('cooler', ...loopParts);
  }

  function setTube(t: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3 }, lift: THREE.Vector3): void {
    const a = t.from.clone().add(lift);
    const b = t.to;
    const curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(-8, 34, 0)), new THREE.Vector3(lerp(a.x, b.x, 0.6), b.y - 40, lerp(a.z, b.z, 0.5)), b.clone().add(new THREE.Vector3(0, -18, 0)), b]);
    const old = t.mesh.geometry;
    t.mesh.geometry = new THREE.TubeGeometry(curve, 48, 6, 12);
    old.dispose();
    const hull = t.mesh.children.find((c) => c.userData.ink) as THREE.Mesh | undefined;
    if (hull) {
      t.mesh.remove(hull);
      hull.geometry.dispose();
    }
    outline(t.mesh, 'thin');
  }
  aioTubes.forEach((t) => setTube(t, new THREE.Vector3()));

  // ---------- monitor and keyboard ----------
  const mon = new THREE.Group();
  const monX = W / 2 + 330;
  const monZ = D / 2 + 60;
  mon.position.set(monX, 0, monZ);
  mon.rotation.y = -Math.PI / 4;
  root.add(mon);
  const screen = createScreen();
  const monParts = [
    rbox(230, 10, 170, mats.black, mon, 0, 5, -30, 4, 'body'),
    rbox(46, 250, 22, mats.darkMetal, mon, 0, 135, -48, 6, 'body'),
    rbox(600, 350, 26, mats.black, mon, 0, 300, -24, 10, 'body'),
  ];
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(574, 323), new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }));
  scr.position.set(0, 300, -10.6);
  mon.add(scr);
  monParts.push(scr);
  hot('monitor', ...monParts);
  // Keyboard
  const keys: THREE.BufferGeometry[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 14; c++) {
      if (r === 4 && c > 3 && c < 10) continue;
      const k = new THREE.BoxGeometry(19, 7, 18);
      k.translate(-143 + c * 22, 18, -46 + r * 23);
      keys.push(k);
    }
  }
  const space = new THREE.BoxGeometry(129, 7, 18);
  space.translate(-143 + 6.5 * 22, 18, -46 + 4 * 23);
  keys.push(space);
  const kb = new THREE.Group();
  kb.position.set(0, 0, 200);
  kb.rotation.y = 0.08;
  mon.add(kb);
  rbox(330, 14, 130, mats.plastic, kb, 0, 7, 0, 5, 'body');
  mesh(mergeGeometries(keys)!, toon(0x3d4150, { shine: 0.3 }), kb, 0, 0, 0, 'thin');

  // ---------- lids ----------
  type Lid = { open: boolean; k: number; apply: (k: number) => void };
  const lids = new Map<LidId, Lid>();
  const defineLid = (id: LidId, apply: (k: number) => void) => lids.set(id, { open: false, k: 0, apply });
  defineLid('glass', (k) => (glassPivot.rotation.y = -1.3 * k));
  defineLid('cooler', (k) => {
    coolerG.position.set(-150 * k, 34 * Math.sin(k * Math.PI * 0.5), 0);
    if (aioTubes.length) aioTubes.forEach((t) => setTube(t, coolerG.position));
    loopCpuTubes.forEach((m) => (m.visible = k < 0.05));
  });
  defineLid('heatsink', (k) => {
    sinkG.position.set(-55 * k, 20 * Math.sin(k * Math.PI), 0);
    sinkG.rotation.y = 0.25 * k;
  });
  defineLid('shroud', (k) => (shroudG.rotation.z = 1.45 * k));

  // ---------- beacons and views ----------
  const toRoot = (v: THREE.Vector3) => v.clone().add(new THREE.Vector3(0, FEET, 0));
  const beaconGeom = new THREE.SphereGeometry(9, 16, 16);
  const beaconAt = (part: PartId, p: THREE.Vector3, local = true) => {
    const b = new THREE.Mesh(beaconGeom, new THREE.MeshBasicMaterial({ color: C.beacon, transparent: true, opacity: 0.92, depthTest: false }));
    b.position.copy(local ? toRoot(p) : p);
    b.renderOrder = 10;
    b.userData.part = part;
    b.userData.beacon = true;
    root.add(b);
    beacons.set(part, b);
    hotspots.get(part)?.push(b);
  };
  const gx = gpuDims ? gpuDims.cx - gpuDims.hx / 2 - 14 : 0;
  beaconAt('case', new THREE.Vector3(-W / 2 - 14, H * 0.82, -D * 0.25));
  beaconAt('power', new THREE.Vector3(btnX, H + 30, ioz));
  beaconAt('motherboard', P(bw * 0.72, bh * 0.62, 18));
  beaconAt('cpu', P(su - 40, sv - 42, 30));
  beaconAt('cooler', new THREE.Vector3(coolerTop.x - 12, sk.y + 40, sk.z));
  beaconAt('ram', P(L.ram.u0 + 14, L.ram.v0 - 4, 50));
  if (gpuDims) beaconAt('gpu', new THREE.Vector3(gx, slotY + 2 - gpuDims.t / 2, gpuDims.z0 + gpuDims.len * 0.62));
  else beaconAt('gpu', P(70, L.pcie[0], 16));
  beaconAt('m2', P((m0 + m1) / 2 + 10, mv, 22));
  beaconAt('storage', s.size === 'itx' ? storageC.clone().add(new THREE.Vector3(-30, 40, -12)) : storageC.clone().add(new THREE.Vector3(-W * 0.4, 10, 0)));
  beaconAt('psu', dm.shroud ? new THREE.Vector3(innerX0 - 14, dm.shroud * 0.55, psuC.z) : psuC.clone().add(new THREE.Vector3(-74, 10, 0)));
  beaconAt('fans', dm.front.n ? fanC.clone().add(new THREE.Vector3(-30, 50, 20)) : fanC.clone().add(new THREE.Vector3(-30, 30, 0)));
  beaconAt('cmos', P(L.cmos[0], L.cmos[1] - 18, 20));
  mon.updateMatrix();
  const monPt = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(mon.matrix);
  beaconAt('monitor', monPt(250, 500, -10), false);

  const view = (target: THREE.Vector3, dir: V3, dist: number, local = true): View => {
    const t = local ? toRoot(target) : target.clone();
    const p = t.clone().addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
    return { target: [t.x * K, t.y * K, t.z * K], pos: [p.x * K, p.y * K, p.z * K] };
  };
  const scale = H / 465;
  const views: Record<PartId, View> = {
    case: view(new THREE.Vector3(0, H * 0.5, 0), [-1, 0.42, 0.62], 1150 * scale),
    power: view(new THREE.Vector3(btnX + 30, H, ioz), [-0.55, 1, 0.8], 420),
    motherboard: view(P(bw / 2, bh / 2, 0), [-1, 0.12, 0.08], 820 * Math.max(bw, bh) / 305),
    cpu: view(P(su, sv, 0), [-1, 0.3, 0.32], 480),
    cooler: view(new THREE.Vector3(coolerTop.x * 0.5 + sk.x * 0.5, sk.y + (s.cooling === 'air' ? 0 : 40), sk.z + (s.cooling === 'air' ? 0 : 60)), [-1, 0.34, 0.5], s.cooling === 'air' ? 640 : 760 * scale),
    ram: view(P(L.ram.u0 + 14, ramMid, 0), [-1, 0.16, 0.18], 440),
    gpu: gpuDims ? view(new THREE.Vector3(gpuDims.cx, slotY - gpuDims.t / 2, gpuDims.z0 + gpuDims.len / 2), [-1, 0.05, 0.42], 640) : view(P(50, L.pcie[0], 0), [-1, 0.2, 0.3], 320),
    m2: view(P((m0 + m1) / 2, mv, 0), [-1, 0.4, 0.22], 420),
    storage: view(storageC, s.size === 'itx' ? [-0.5, 0.3, 1] : [-1, 0.42, 0.45], s.size === 'itx' ? 360 : 460),
    psu: view(psuC, [-1, 0.36, 0.3], 560),
    fans: dm.front.n ? view(fanC, [-0.65, 0.25, 1], 740 * scale) : view(fanC, [-0.6, 1, 0.4], 520),
    // On Mini-ITX the battery sits just under the socket (the cooler lifts away), so look straight in over the GPU.
    cmos: L === ITX ? view(P(L.cmos[0], L.cmos[1], 0), [-1, 0.06, -0.32], 380) : view(P(L.cmos[0], L.cmos[1], 0), [-1, 0.2, 0.15], 360),
    monitor: view(monPt(0, 300, 0), [-0.707, 0.12, 0.707], 900, false),
  };
  const ovT = new THREE.Vector3(monX * 0.42, H * 0.44 + FEET, monZ * 0.42);
  const ovP = ovT.clone().addScaledVector(new THREE.Vector3(-0.62, 0.4, 1).normalize(), 1900 * Math.max(scale, 0.8));
  const overview: View = { target: [ovT.x * K, ovT.y * K, ovT.z * K], pos: [ovP.x * K, ovP.y * K, ovP.z * K] };

  // Interior RGB glow.
  const glow = new THREE.PointLight(0xffffff, 0, 4, 2);
  glow.position.set(innerCx * K, (H * 0.6 + FEET) * K, 0);
  const glowHolder = new THREE.Group();
  glowHolder.add(glow);

  // ---------- look, power and animation ----------
  let rgbMode = s.rgb;
  const rgbColor = new THREE.Color(s.rgbColor);
  let power = 1;
  let boot: { start: number } | null = null;
  let clock = 0;
  let lastT = 0;
  let focused: PartId | null = null;
  let usbShown = false;

  function showUsb(on: boolean): void {
    if (on === usbShown) return;
    usbShown = on;
    const from = usb.scale.x;
    tween({ duration: 450, ease: easeInOutCubic, tag: 'usb', update: (k) => usb.scale.setScalar(Math.max(0.001, lerp(from, on ? 1 : 0, k))) });
  }

  function setLook(n: Setup): void {
    mats.case.color.set(n.caseColor);
    mats.inner.color.set(n.caseColor).multiplyScalar(0.62);
    rgbMode = n.rgb;
    rgbColor.set(n.rgbColor);
    for (const m of coolantMats) {
      m.color.set(n.rgbColor);
      m.emissive.set(n.rgbColor);
    }
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.userData.coverColor) {
        const mat = m.material as THREE.MeshToonMaterial;
        mat.map?.dispose();
        mat.map = label([{ text: 'DIY', size: 60, color: '#ffffff' }], n.caseColor, 512, 96);
        mat.needsUpdate = true;
      }
    });
  }

  function startBoot(): void {
    boot = { start: clock };
    showUsb(true);
    tween({ duration: 3200, ease: (t) => t, tag: 'boost-gpu', update: (k) => (boost.gpu = k < 0.35 ? 0 : Math.sin(((k - 0.35) / 0.65) * Math.PI)) });
  }

  const bootSteps: [number, 'off' | 'post' | 'bios' | 'install' | 'desktop'][] = [
    [0, 'off'],
    [0.9, 'post'],
    [3.1, 'bios'],
    [5.8, 'install'],
    [9.4, 'desktop'],
  ];

  function pulse(tag: string, ms: number, update: (k: number) => void): void {
    tween({ duration: ms, ease: (t) => t, tag, update, done: () => update(0) });
  }

  const tmp = new THREE.Color();
  return {
    key: rigKey(s),
    group: (() => {
      const g = new THREE.Group();
      g.add(root, glowHolder);
      return g;
    })(),
    hotspots,
    beacons,
    views,
    overview,
    setLid(lid, open) {
      const l = lids.get(lid);
      if (!l || l.open === open) return;
      l.open = open;
      const k0 = l.k;
      tween({
        duration: lid === 'glass' ? 850 : 750,
        ease: easeInOutCubic,
        tag: `lid-${lid}`,
        update: (k) => {
          l.k = lerp(k0, open ? 1 : 0, k);
          l.apply(l.k);
        },
      });
    },
    isLidOpen: (lid) => lids.get(lid)?.open ?? false,
    setLook,
    setSpecs: (sp) => screen.setSpecs(sp),
    focus(part) {
      focused = part;
      if (boot) return;
      if (part === 'monitor') {
        screen.set('bios');
        showUsb(true);
      } else if (screen.state() !== 'desktop') {
        screen.set('desktop');
        showUsb(false);
      } else showUsb(false);
    },
    poke(part) {
      if (part === 'power') startBoot();
      else if (part === 'fans') pulse('boost-case', 2400, (k) => (boost.case = Math.sin(k * Math.PI)));
      else if (part === 'cooler') pulse('boost-cooler', 2400, (k) => (boost.cooler = Math.sin(k * Math.PI)));
      else if (part === 'gpu') {
        pulse('boost-gpu', 2600, (k) => (boost.gpu = Math.sin(k * Math.PI)));
        tween({ duration: 1500, ease: (t) => t, tag: 'gpu-pop', update: (k) => (gpuG.position.x = -Math.sin(k * Math.PI) * 38) });
      } else if (part === 'ram') {
        tween({
          duration: 1500,
          ease: (t) => t,
          tag: 'ram-pop',
          update: (k) => ramSticks.forEach((st, i) => {
            const p = Math.min(1, Math.max(0, (k * 1500 - i * 140) / 1100));
            st.position.x = P(0, 0, 0).x - Math.sin(p * Math.PI) * 26;
          }),
        });
      } else if (part === 'cmos') {
        tween({ duration: 1300, ease: (t) => t, tag: 'cmos-pop', update: (k) => {
          cmosG.position.x = cm.x - Math.sin(k * Math.PI) * 12;
          cmosG.rotation.z = Math.sin(k * Math.PI) * 0.35;
        } });
      }
    },
    update(t) {
      const dt = Math.min(0.05, t - lastT);
      lastT = t;
      clock = t;
      // Boot sequence: power down, POST, BIOS, installer, desktop.
      if (boot) {
        const e = t - boot.start;
        power = e < 0.5 ? 1 - e / 0.5 : Math.min(1, (e - 0.7) / 0.6);
        power = Math.max(0, power);
        let st = bootSteps[0][1];
        for (const [at, name] of bootSteps) if (e >= at) st = name;
        if (screen.state() !== st) screen.set(st);
        if (e >= 9.4) {
          boot = null;
          power = 1;
          if (focused === 'monitor') screen.set('bios');
          else showUsb(false);
        }
      }
      screen.update(t);
      for (const r of rotors) r.obj.rotation.z += (r.speed * power + boost[r.boost] * 26) * dt;
      // RGB
      const on = rgbMode !== 'off';
      for (const { mat, phase } of rgbMats) {
        if (!on) {
          mat.color.setHex(0x3a3d48);
          mat.emissive.setHex(0x000000);
          continue;
        }
        if (rgbMode === 'solid') tmp.copy(rgbColor);
        else tmp.setHSL((t * 0.12 + phase) % 1, 0.95, 0.6);
        mat.color.copy(tmp);
        mat.emissive.copy(tmp);
        mat.emissiveIntensity = 0.9 * power;
      }
      if (on) {
        if (rgbMode === 'solid') glow.color.copy(rgbColor);
        else glow.color.setHSL((t * 0.12 + 0.4) % 1, 0.95, 0.6);
      }
      glow.intensity = on ? 1.2 * power : 0;
      for (const m of coolantMats) m.emissiveIntensity = 0.12 + 0.3 * power;
      ledMat.emissiveIntensity = power;
    },
    dispose() {
      disposeTree(root);
      screen.texture.dispose();
    },
  };
}
