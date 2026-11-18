/**
 * Stylized comic-book PC: a glass-sided case with a motherboard, CPU, cooler
 * (air, AIO or custom loop), RAM, GPU, drives and PSU, plus a monitor that
 * shows POST, the BIOS and an OS install. Modelled in millimetres and scaled
 * down; the contract with the scene is `Rig`. Every PartId in data/parts.ts
 * gets hotspot meshes, a beacon and a camera view.
 */
import * as THREE from 'three';
import { tween, easeInOutCubic, lerp } from '../../shared/tween';
import { disposeTree } from '../../shared/toon';
import type { V3 } from '../../shared/scene/kit';
import { hex } from '../../shared/theme';
import type { StageRig, View } from '../../shared/scene/stage';
import type { LidId, PartId } from '../data/parts';
import type { Setup } from '../data/setup';
import { createCtx } from './ctx';
import { buildCaseShell, buildCaseFans } from './zones/case';
import { buildMotherboard, buildGpu } from './zones/board';
import { buildCooling, buildLoop } from './zones/cooling';
import { buildPsuArea } from './zones/psu';
import { buildDesk } from './zones/desk';
import type { Specs } from './screen';
import { K, FEET, ITX } from './layout';
import { label } from './kit';

export interface Rig extends StageRig<PartId, LidId> {
  /** Colours and RGB update in place, without a rebuild. */
  setLook(s: Setup): void;
  setSpecs(s: Specs): void;
  /** The scene tells the rig what's selected so the monitor can follow along. */
  focus(part: PartId | null): void;
}

export const rigKey = (s: Setup) => `${s.size}|${s.cooling}|${s.gpu}`;

export function buildRig(s: Setup): Rig {
  const c = createCtx(s);
  const { dm, W, H, D, L, root, hotspots, beacons, rgbMats, coolantMats, rotors, boost, mats } = c;
  const shell = buildCaseShell(c);
  const { innerX0, innerCx, bw, bh, P, glassPivot, ioz, btnX, ledMat, usb } = shell;
  const board = buildMotherboard(c, shell);
  const { su, sv, m0, m1, mv, sk, ramSticks, ramMid, sinkG, cmosG, cm } = board;
  const gpu = buildGpu(c, shell);
  const { slotY, gpuG, gpuDims } = gpu;
  const cooling = buildCooling(c, shell, board, gpu);
  const { coolerG, aioTubes, loopCpuTubes, coolerTop } = cooling;
  const psu = buildPsuArea(c, shell);
  const { shroudG, psuC, storageC } = psu;
  const fans = buildCaseFans(c, shell, cooling);
  const { fanC } = fans;
  const plumbing = buildLoop(c, shell, board, gpu, cooling);
  const { setTube } = plumbing;
  const desk = buildDesk(c);
  const { mon, monX, monZ, screen } = desk;

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


  const toRoot = (v: THREE.Vector3) => v.clone().add(new THREE.Vector3(0, FEET, 0));
  const beaconGeom = new THREE.SphereGeometry(9, 16, 16);
  const beaconAt = (part: PartId, p: THREE.Vector3, local = true) => {
    const b = new THREE.Mesh(beaconGeom, new THREE.MeshBasicMaterial({ color: hex('cyan'), transparent: true, opacity: 0.92, depthTest: false }));
    b.position.copy(local ? toRoot(p) : p);
    b.renderOrder = 10;
    b.userData.area = part;
    b.userData.beacon = true;
    root.add(b);
    beacons.set(part, b);
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

  const glow = new THREE.PointLight(0xffffff, 0, 4, 2);
  glow.position.set(innerCx * K, (H * 0.6 + FEET) * K, 0);
  const glowHolder = new THREE.Group();
  glowHolder.add(glow);


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
    picks: [...[...hotspots.values()].flat(), ...beacons.values()],
    glow: hotspots,
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
