import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glass, inkLine, toon } from '../../../shared/toon';
import { add, mapped } from '../../../shared/scene/kit';
import { hex } from '../../../shared/theme';
import { T, FEET } from '../layout';
import { stripes, perforated } from '../kit';
import type { PcCtx } from '../ctx';
import type { Cooling } from '../zones/cooling';

export function buildCaseShell(c: PcCtx) {
  const { dm, W, H, D, L, root, cg, rbox, cylX, hot, mats, s } = c;
  const trayX = W / 2 - dm.gap;
  const innerX0 = -W / 2 + T;
  const innerCx = (innerX0 + trayX) / 2;
  const right = rbox(T, H, D, mats.case, cg, { at: [W / 2 - T / 2, H / 2, 0], r: 3, ink: 'body' });
  const top = rbox(W, T, D, mats.case, cg, { at: [0, H - T / 2, 0], r: 3, ink: 'body' });
  const bottom = rbox(W, T, D, mats.case, cg, { at: [0, T / 2, 0], r: 3, ink: 'body' });
  const rear = rbox(W, H, T, mats.case, cg, { at: [0, H / 2, -D / 2 + T / 2], ink: 'body' });
  hot('case', right, top, bottom, rear);
  rbox(2, H - 2 * T, D - 2 * T, mats.inner, cg, { at: [trayX + 1, H / 2, 0], r: 0.5, ink: null }); // motherboard tray

  // Front: a frame round a perforated mesh you can see the fans through.
  const fz = D / 2 - T / 2;
  const fb = 18;
  const frontBars = [
    rbox(fb, H, T, mats.case, cg, { at: [-W / 2 + fb / 2, H / 2, fz], ink: 'body' }),
    rbox(fb, H, T, mats.case, cg, { at: [W / 2 - fb / 2, H / 2, fz], ink: 'body' }),
    rbox(W, 24, T, mats.case, cg, { at: [0, H - 12, fz], ink: 'body' }),
    rbox(W, 24, T, mats.case, cg, { at: [0, 12, fz], ink: 'body' }),
  ];
  hot('case', ...frontBars);
  const frontMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 2 * fb, H - 48),
    new THREE.MeshBasicMaterial({ map: perforated([(W - 2 * fb) / 9, (H - 48) / 9]), transparent: true, depthWrite: false }),
  );
  frontMesh.position.set(0, H / 2, D / 2 - 1);
  cg.add(frontMesh);

  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    add(new THREE.CylinderGeometry(11, 13, FEET, 20), mats.black, root, { at: [x * (W / 2 - 22), FEET / 2, z * (D / 2 - 30)] });
  }

  // Top vent over the fans or radiator.
  const vent = rbox(W - 50, 1.6, D * 0.62, mapped(0x9aa0ab, stripes([1, 34], '#3b3f4c', '#1a1b22')), cg, { at: [-8, H + 0.6, -D * 0.12], r: 0.6, ink: null });
  hot('case', vent);

  // Rear: I/O cutout, slot covers, a fan grille.
  const rz = -D / 2 - 0.7;
  const bw = dm.board.w;
  const bh = dm.board.h;
  const boardRear = -D / 2 + T + dm.boardRear;
  const boardTop = H - T - dm.boardTop;
  const boardFace = trayX - 8.6;
  const P = (u: number, v: number, dx: number) => new THREE.Vector3(boardFace - dx, boardTop - v, boardRear + u);
  rbox(W * 0.32, L.io[1] - L.io[0], 1.4, mats.black, cg, { at: [boardFace - W * 0.16 + 4, boardTop - (L.io[0] + L.io[1]) / 2, rz], r: 0.5, ink: null });
  for (let i = 0; i < (s.size === 'itx' ? 2 : 7); i++) {
    rbox(W * 0.62, 9, 1.4, mats.darkMetal, cg, { at: [innerCx, boardTop - L.pcie[0] - 4 - i * 20.3, rz], r: 0.5, ink: null });
  }
  const rearFan = dm.rear;
  if (rearFan) {
    const ry = boardTop - 20 - rearFan / 2;
    const rx = boardFace - 25 - rearFan / 2;
    const ringPts = Array.from({ length: 49 }, (_, i) => new THREE.Vector3(rx + Math.cos((i / 48) * Math.PI * 2) * rearFan * 0.46, ry + Math.sin((i / 48) * Math.PI * 2) * rearFan * 0.46, rz - 0.4));
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
    rbox(4, 12, D, mats.black, glassPivot, { at: [-1.5, H - 6, D / 2], r: 1.5 }),
    rbox(4, 12, D, mats.black, glassPivot, { at: [-1.5, 6, D / 2], r: 1.5 }),
    rbox(4, H, 12, mats.black, glassPivot, { at: [-1.5, H / 2, 6], r: 1.5 }),
    rbox(4, H, 12, mats.black, glassPivot, { at: [-1.5, H / 2, D - 6], r: 1.5 }),
  ];
  hot('case', ...trim);
  for (const y of [H * 0.2, H * 0.8]) cylX(5, 6, mats.metal, glassPivot, { at: [-5, y, 6], seg: 16 });

  // Front I/O on the top panel: power button, USB, audio.
  const ioz = D / 2 - 26;
  const ioPlate = rbox(W * 0.62, 2.4, 30, mats.black, cg, { at: [-W / 2 + W * 0.36, H + 1.2, ioz], r: 1 });
  const btnX = -W / 2 + 24;
  const btn = add(new THREE.CylinderGeometry(9, 9, 4, 28), mats.metal, cg, { at: [btnX, H + 2.6, ioz] });
  const ledMat = toon(0x3a3d48, { halftone: 0, emissive: hex('cyan'), emissiveIntensity: 1 });
  const led = new THREE.Mesh(new THREE.TorusGeometry(9.6, 1.1, 8, 40), ledMat);
  led.rotation.x = Math.PI / 2;
  led.position.set(btnX, H + 4.4, ioz);
  cg.add(led);
  hot('power', ioPlate, btn, led);
  const usbXs = [btnX + 26, btnX + 42];
  for (const x of usbXs) rbox(13, 1.2, 5, mats.slot, cg, { at: [x, H + 2.6, ioz], r: 0.4, ink: null });
  rbox(9, 1.2, 3.4, mats.slot, cg, { at: [btnX + 56, H + 2.6, ioz], r: 1, ink: null });
  add(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 16), mats.slot, cg, { at: [btnX + 68, H + 2.6, ioz], ink: null });
  // Installer USB stick: pops into the first port while the BIOS or an install is on screen.
  const usb = new THREE.Group();
  usb.position.set(usbXs[0], H + 2, ioz);
  usb.scale.setScalar(0.001);
  cg.add(usb);
  rbox(12, 12, 4.6, mats.metal, usb, { at: [0, 6, 0], r: 0.6 });
  rbox(17, 34, 7, toon(0xffd23f, { shine: 0.5 }), usb, { at: [0, 27, 0], r: 3 });
  hot('monitor', usb);
  return { trayX, innerX0, innerCx, bw, bh, boardRear, boardTop, boardFace, P, glassPivot, ioz, btnX, ledMat, usb };
}

export type CaseShell = ReturnType<typeof buildCaseShell>;

export function buildCaseFans(c: PcCtx, shell: CaseShell, cooling: Cooling) {
  const { dm, H, D, cg, hot, rgb, fan, s } = c;
  const { innerX0, innerCx, boardTop, boardFace } = shell;
  const { cl, radX } = cooling;
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

  const strip = new THREE.Mesh(new RoundedBoxGeometry(4, 4, D * 0.7, 1, 1), rgb(0.8));
  strip.position.set(innerX0 + 4, H - T - 4, 0);
  cg.add(strip);
  return { fanC };
}

export type CaseFans = ReturnType<typeof buildCaseFans>;
