import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AREAS, type AreaId, type LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { buildRig, rigKey, type Rig } from './rig';
import { tween, updateTweens, easeInOutCubic, easeOutBack, lerp } from '../../shared/tween';
import { lineMaterials, setHighlight, shared } from '../../shared/toon';

export interface SceneApi {
  focus(area: AreaId | null): void;
  onSelect(cb: (area: AreaId | null) => void): void;
  onHover(cb: (area: AreaId | null) => void): void;
  setSetup(s: Setup): void;
}

const ALL_LIDS: LidId[] = ['bedFront', 'shedDoors', 'compostSlats', 'rowCover'];

export function createScene(canvas: HTMLCanvasElement, initial: Setup): SceneApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.8;
  controls.maxDistance = 16;
  controls.maxPolarAngle = Math.PI / 2 - 0.06;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;

  // Same comic lighting as the PC: warm key, cool fill, magenta + cyan rims.
  scene.add(new THREE.HemisphereLight(0xd9e2ff, 0x2a1830, 0.85));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.5);
  key.position.set(-5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = key.shadow.camera.bottom = -5.4;
  key.shadow.camera.right = key.shadow.camera.top = 5.4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const magenta = new THREE.DirectionalLight(0xff4fd8, 0.7);
  magenta.position.set(7, 3, -5);
  scene.add(magenta);
  const cyan = new THREE.DirectionalLight(0x45e0ff, 0.6);
  cyan.position.set(-7, 2.5, -6);
  scene.add(cyan);
  const front = new THREE.DirectionalLight(0xb8c4ff, 0.35);
  front.position.set(-3, 3, 8);
  scene.add(front);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.12, 5.7, 72),
    new THREE.MeshBasicMaterial({ color: 0x0f1218, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);

  let rig: Rig = buildRig(initial);
  scene.add(rig.group);

  function overviewFit(): { pos: [number, number, number]; target: [number, number, number] } {
    const { pos, target } = rig.overview;
    const k = Math.min(3, Math.max(0.85, 1.3 / camera.aspect));
    const t = new THREE.Vector3(...target);
    const p = new THREE.Vector3(...pos).sub(t).multiplyScalar(k).add(t);
    // Portrait screens need to back off further than the desktop limit.
    controls.maxDistance = Math.max(16, p.distanceTo(t) * 1.15);
    return { pos: [p.x, p.y, p.z], target };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hovered: AreaId | null = null;
  let selected: AreaId | null = null;
  const selectCbs: ((a: AreaId | null) => void)[] = [];
  const hoverCbs: ((a: AreaId | null) => void)[] = [];

  function setGlow(a: AreaId | null, level: 'none' | 'hover' | 'selected'): void {
    if (!a) return;
    for (const m of rig.glow.get(a) ?? []) setHighlight(m, level);
  }
  function refreshGlow(): void {
    for (const a of rig.glow.keys()) setGlow(a, 'none');
    if (hovered && hovered !== selected) setGlow(hovered, 'hover');
    if (selected) setGlow(selected, 'selected');
  }

  function pickArea(ev: PointerEvent): AreaId | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(rig.picks, false);
    const beacon = hits.find((h) => h.object.userData.beacon && h.object.visible);
    if (beacon) return beacon.object.userData.area as AreaId;
    // Pick boxes overlap (the corn towers over its neighbours): prefer the nearest.
    return (hits.find((h) => !h.object.userData.beacon)?.object.userData.area as AreaId | undefined) ?? null;
  }

  let downAt: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 6) return;
    const a = pickArea(e);
    if (a && a === selected) rig.poke(a);
    selectCbs.forEach((cb) => cb(a));
  });
  let moveQueued = false;
  canvas.addEventListener('pointermove', (e) => {
    if (moveQueued) return;
    moveQueued = true;
    requestAnimationFrame(() => {
      moveQueued = false;
      const a = pickArea(e);
      if (a !== hovered) {
        hovered = a;
        canvas.style.cursor = a ? 'pointer' : 'grab';
        refreshGlow();
        hoverCbs.forEach((cb) => cb(a));
      }
    });
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    refreshGlow();
    hoverCbs.forEach((cb) => cb(null));
  });

  let idleTimer: number | undefined;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!selected) controls.autoRotate = true;
    }, 9000);
  });

  function flyTo(pos: [number, number, number], target: [number, number, number]): void {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...pos);
    const t1 = new THREE.Vector3(...target);
    const lift = Math.min(0.8, p0.distanceTo(p1) * 0.12);
    tween({
      duration: 1200,
      ease: easeInOutCubic,
      tag: 'camera',
      update: (k) => {
        camera.position.lerpVectors(p0, p1, k);
        camera.position.y += Math.sin(k * Math.PI) * lift;
        controls.target.lerpVectors(t0, t1, k);
      },
    });
  }

  function applyLids(a: AreaId | null): void {
    const want = new Set<LidId>(a ? AREAS[a].opens ?? [] : []);
    for (const lid of ALL_LIDS) rig.setLid(lid, want.has(lid));
  }

  function flyToArea(a: AreaId | null): void {
    if (a) {
      const v = rig.views[a];
      const t = new THREE.Vector3(...v.target);
      const p = new THREE.Vector3(...v.pos);
      if (window.innerWidth <= 720) {
        p.sub(t).multiplyScalar(1.3).add(t);
        const down = new THREE.Vector3(0, -1, 0).multiplyScalar(p.distanceTo(t) * 0.2);
        t.add(down);
        p.add(down);
      } else {
        const right = new THREE.Vector3().subVectors(t, p).cross(new THREE.Vector3(0, 1, 0)).normalize();
        const shift = right.multiplyScalar(p.distanceTo(t) * 0.2);
        t.add(shift);
        p.add(shift);
      }
      flyTo([p.x, p.y, p.z], [t.x, t.y, t.z]);
    } else {
      const o = overviewFit();
      flyTo(o.pos, o.target);
      idleTimer = window.setTimeout(() => (controls.autoRotate = true), 4000);
    }
  }

  function focus(a: AreaId | null): void {
    selected = a;
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
    applyLids(a);
    flyToArea(a);
    refreshGlow();
    if (a) rig.poke(a);
  }

  // ---------- rebuilds when the season, bed fill or hydro system changes ----------
  let swapping = false;
  let pending: Setup | null = null;

  function swap(s: Setup): void {
    swapping = true;
    const old = rig;
    tween({
      duration: 220,
      ease: (t) => t * t,
      tag: 'swap-out',
      update: (k) => old.group.scale.setScalar(Math.max(0.001, lerp(1, 0, k))),
      done: () => {
        scene.remove(old.group);
        old.dispose();
        rig = buildRig(s);
        rig.group.scale.setScalar(0.001);
        scene.add(rig.group);
        syncLineResolution();
        applyLids(selected);
        refreshGlow();
        tween({
          duration: 560,
          ease: easeOutBack,
          tag: 'swap-in',
          update: (k) => rig.group.scale.setScalar(Math.max(0.001, k)),
          done: () => {
            swapping = false;
            if (pending) {
              const next = pending;
              pending = null;
              setSetup(next);
            }
          },
        });
      },
    });
  }

  function setSetup(s: Setup): void {
    if (swapping) {
      pending = s;
      return;
    }
    if (rigKey(s) !== rig.key) swap(s);
  }

  // ---------- render loop ----------
  function syncLineResolution(): void {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement ?? canvas;
    lineMaterials.forEach((m) => m.resolution.set(w, h));
  }
  function resize(): void {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement ?? canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    shared.uDotSize.value = 5.5 * renderer.getPixelRatio();
    syncLineResolution();
  }
  window.addEventListener('resize', resize);
  resize();
  const start = overviewFit();
  camera.position.set(...start.pos);
  controls.target.set(...start.target);

  const keyDir = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    updateTweens(performance.now());
    rig.update(t);
    const pulse = 1 + Math.sin(t * 3.2) * 0.12;
    rig.beacons.forEach((b, a) => {
      b.visible = a !== selected;
      b.getWorldPosition(tmpV);
      b.scale.setScalar(pulse * Math.min(1.3, Math.max(0.3, tmpV.distanceTo(camera.position) / 6)));
    });
    controls.update();
    camera.updateMatrixWorld();
    keyDir.copy(key.position).sub(key.target.position).normalize();
    shared.uKeyDir.value.copy(keyDir).transformDirection(camera.matrixWorldInverse);
    shared.uUpView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
    renderer.render(scene, camera);
  });
  (window as unknown as { __garden?: unknown }).__garden = { renderer, camera, controls, scene };

  return {
    focus,
    onSelect: (cb) => selectCbs.push(cb),
    onHover: (cb) => hoverCbs.push(cb),
    setSetup,
  };
}
