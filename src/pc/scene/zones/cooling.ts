import * as THREE from 'three';
import { lerp } from '../../../shared/tween';
import { outline } from '../../../shared/toon';
import { add, mapped } from '../../../shared/scene/kit';
import { PALETTE } from '../../../shared/theme';
import { T } from '../layout';
import { label, stripes, bentPath } from '../kit';
import type { PcCtx } from '../ctx';
import type { CaseShell } from '../zones/case';
import type { Board, Gpu } from '../zones/board';

export function buildCooling(c: PcCtx, shell: CaseShell, board: Board, gpu: Gpu) {
  const { dm, H, D, L, cg, rbox, cylX, rgb, coolant, fan, mats, s } = c;
  const { trayX, innerX0, bw, boardRear, boardTop, boardFace, P } = shell;
  const { sk } = board;
  const { slotY, gpuG, gpuDims } = gpu;
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
    const core = rbox(120, 27, radL - 28, mapped(0xb7bdcc, stripes([1, radL / 4], '#9aa1b2', '#2b2f3a'), { shine: 0.3 }), cg, { at: [radX, radY, (radZ0 + radZ1) / 2], r: 1.5, ink: 'body' });
    const tanks = [radZ0 + 7, radZ1 - 7].map((z) => rbox(124, 31, 14, mats.darkMetal, cg, { at: [radX, radY, z], r: 3, ink: 'body' }));
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
    cl.push(rbox(8, 46, 46, mats.copper, coolerG, { at: [sk.x - 12, sk.y, sk.z], r: 1.5 }));
    for (const dz of [-15, -5, 5, 15]) cl.push(cylX(3.2, 140, mats.copper, coolerG, { at: [sk.x - 84, sk.y + (dz % 10 === 5 ? 18 : -18), sk.z + dz], seg: 12 }));
    const stackLen = 108;
    const fins = rbox(stackLen, 122, 54, mapped(0xc4cad6, stripes([22, 1], '#d4d9e3', '#6f7688'), { shine: 0.5, metal: 0.4 }), coolerG, { at: [sk.x - 42 - stackLen / 2, sk.y, sk.z], ink: 'body' });
    const cap = rbox(6, 126, 58, mapped(0xffffff, label([{ text: 'DIY', size: 44, color: PALETTE.ink }], '#d8dce6', 128, 256)), coolerG, { at: [sk.x - 153, sk.y, sk.z], r: 2.5, ink: 'body' });
    const f = fan(120, coolerG, { ring: s.rgb !== 'off', boost: 'cooler', phase: 0.2 });
    f.position.set(sk.x - 96, sk.y, sk.z + 27 + 13);
    cl.push(fins, cap, f);
    coolerTop.x = sk.x - 156;
  } else if (s.cooling === 'aio' || s.size === 'itx') {
    cl.push(cylX(34, 34, mats.darkMetal, coolerG, { at: [sk.x - 21, sk.y, sk.z], seg: 40, ink: 'body' }));
    const capMat = mapped(0xffffff, label([{ text: 'DIY', size: 96, color: PALETTE.text }], '#1b1a23', 256, 256));
    const capMesh = cylX(29, 3, capMat, coolerG, { at: [sk.x - 39, sk.y, sk.z], seg: 40 });
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
    cl.push(rbox(24, 74, 74, mats.darkMetal, coolerG, { at: [sk.x - 16, sk.y, sk.z], r: 4, ink: 'body' }));
    cl.push(rbox(4, 58, 58, coolant(), coolerG, { at: [sk.x - 30, sk.y, sk.z] }));
    for (const dy of [-20, 20]) cl.push(cylX(8, 10, mats.metal, coolerG, { at: [sk.x - 34, sk.y + dy, sk.z + 22], seg: 20 }));
    radiator();
    coolerTop.x = sk.x - 40;
  }

  // Interior cable runs (sleeved): 24-pin, CPU 8-pin and GPU power to the tray grommets.
  const grommetZ = boardRear + bw + (s.size === 'itx' ? 6 : 22);
  const cable = (pts: THREE.Vector3[], r: number) => {
    const m = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 10), mats.sleeve, cg);
    return m;
  };
  if (s.size !== 'itx') {
    for (const v of [70, 160, 250]) rbox(1.2, 52, 16, mats.black, cg, { at: [trayX - 0.6, boardTop - v, grommetZ], r: 6, ink: null });
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
  return { coolerG, cl, radX, radY, radZ1, aioTubes, loopCpuTubes, coolerTop };
}

export type Cooling = ReturnType<typeof buildCooling>;

export function buildLoop(c: PcCtx, shell: CaseShell, board: Board, gpu: Gpu, cooling: Cooling) {
  const { dm, loop, cg, rbox, hot, coolant, mats } = c;
  const { boardFace } = shell;
  const { sk } = board;
  const { slotY, gpuG, gpuDims } = gpu;
  const { radY, radZ1, aioTubes, loopCpuTubes } = cooling;
  if (loop && dm.shroud) {
    const xT = boardFace - 75;
    const zRes = radZ1 - 9;
    const resX = xT - 40;
    const base = dm.shroud;
    const pump = add(new THREE.CylinderGeometry(33, 33, 50, 36), mats.black, cg, { at: [resX, base + 25, zRes], ink: 'body' });
    const resBody = add(new THREE.CylinderGeometry(28, 28, 150, 36), coolant(), cg, { at: [resX, base + 50 + 75, zRes], ink: 'body' });
    const resCap = add(new THREE.CylinderGeometry(31, 31, 10, 36), mats.darkMetal, cg, { at: [resX, base + 205, zRes], ink: 'body' });
    const loopParts: THREE.Object3D[] = [pump, resBody, resCap];
    const sy = sk.y;
    const fit = sk.z + 22;
    const pipe = (pts: THREE.Vector3[]) => {
      const m = add(new THREE.TubeGeometry(bentPath(pts), pts.length * 30, 6.5, 14), coolant(), cg);
      loopParts.push(m);
      return m;
    };
    const y1 = base + 25;
    const radPortY = radY - 15;
    if (gpuDims) {
      const { z0, len, t } = gpuDims;
      const zGT = z0 + len - 34;
      const yTop = slotY + 2;
      const term = rbox(24, t + 22, 26, mats.metal, gpuG, { at: [xT, yTop - t / 2, zGT], r: 4 });
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
  return { setTube };
}

export type Plumbing = ReturnType<typeof buildLoop>;
