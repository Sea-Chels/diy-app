import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { inkLine } from '../../../shared/toon';
import { mapped } from '../../../shared/scene/kit';
import { PALETTE } from '../../../shared/theme';
import { T } from '../layout';
import { label, C, stripes } from '../kit';
import type { PcCtx } from '../ctx';
import type { CaseShell } from '../zones/case';

export function buildMotherboard(c: PcCtx, shell: CaseShell) {
  const { L, cg, rbox, cylX, hot, rgb, mats } = c;
  const { bw, bh, boardRear, boardTop, boardFace, P } = shell;
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
    const chip = rbox(12, v1 - v0, u1 - u0, mapped(0xffffff, label([{ text: 'DIY', size: 64, color: PALETTE.text }, { text: 'B650', size: 30, color: PALETTE.cyan }], '#3c4252')), cg, p.x, p.y, p.z, 3, 'body');
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

  const cmosG = new THREE.Group();
  const cm = P(L.cmos[0], L.cmos[1], 0);
  cmosG.position.copy(cm);
  cg.add(cmosG);
  const cmosParts = [cylX(11.5, 3, mats.black, cmosG, -1.5, 0, 0, 28), cylX(10, 3.2, mats.metal, cmosG, -4, 0, 0, 28)];
  hot('cmos', ...cmosParts);
  return { su, sv, m0, m1, mv, sk, ramSticks, ramMid, sinkG, cmosG, cm };
}

export type Board = ReturnType<typeof buildMotherboard>;

export function buildGpu(c: PcCtx, shell: CaseShell) {
  const { D, L, loop, cg, mesh, rbox, hot, rgb, coolant, fan, mats, s } = c;
  const { boardTop, boardFace } = shell;
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
    const side = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.42, t * 0.52), new THREE.MeshBasicMaterial({ map: label([{ text: 'DIY GAMING', size: 52, color: PALETTE.text }], '#2a2c36', 512, 96) }));
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
  return { slotY, gpuG, gpuDims };
}

export type Gpu = ReturnType<typeof buildGpu>;
