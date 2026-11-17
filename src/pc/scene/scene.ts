import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PARTS, type LidId, type PartId } from '../data/parts';
import type { Setup } from '../data/setup';
import { buildRig, rigKey, type Rig } from './rig';
import type { Specs } from './screen';
import { tween, updateTweens, easeInOutCubic, easeOutBack, lerp } from '../../shared/tween';
import { lineMaterials, setHighlight, shared, toon } from '../../shared/toon';

export interface SceneApi {
  focus(part: PartId | null): void;
  onSelect(cb: (part: PartId | null) => void): void;
  onHover(cb: (part: PartId | null) => void): void;
  setSetup(s: Setup): void;
  setSpecs(s: Specs): void;
}

const ALL_LIDS: LidId[] = ['glass', 'cooler', 'heatsink', 'shroud'];

export function createScene(canvas: HTMLCanvasElement, initial: Setup, specs: Specs): SceneApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping; // keep comic colours punchy

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.7;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;

  // Lights: warm key, cool fill, magenta + cyan rims for the Spider-Verse look.
  scene.add(new THREE.HemisphereLight(0xc9d2ff, 0x2a1830, 0.8));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.45);
  key.position.set(-4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const magenta = new THREE.DirectionalLight(0xff4fd8, 0.9);
  magenta.position.set(6, 3, -4);
  scene.add(magenta);
  const cyan = new THREE.DirectionalLight(0x45e0ff, 0.8);
  cyan.position.set(-6, 2.5, -5);
  scene.add(cyan);
  const front = new THREE.DirectionalLight(0xb8c4ff, 0.35);
  front.position.set(-3, 3, 7);
  scene.add(front);

  // Ground: toon disc so shadows pick up halftone dots.
  const ground = new THREE.Mesh(new THREE.CircleGeometry(5.2, 64), toon(0x1d2133, { halftone: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.position.set(0.8, 0, 0.6);
  scene.add(ground);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.6, 5.2, 64),
    new THREE.MeshBasicMaterial({ color: 0x0f1218, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0.8, 0.001, 0.6);
  scene.add(ring);

  let rig: Rig = buildRig(initial);
  rig.setLook(initial);
  rig.setSpecs(specs);
  scene.add(rig.group);
  /** Portrait screens need the camera further back to fit the PC and monitor side by side. */
  function overviewFit(): { pos: [number, number, number]; target: [number, number, number] } {
    const { pos, target } = rig.overview;
    const k = Math.min(2.7, Math.max(1, 1.6 / camera.aspect));
    const t = new THREE.Vector3(...target);
    const p = new THREE.Vector3(...pos).sub(t).multiplyScalar(k).add(t);
    return { pos: [p.x, p.y, p.z], target };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let allHotspots: THREE.Mesh[] = [];
  function indexHotspots(): void {
    allHotspots = [];
    rig.hotspots.forEach((list) => allHotspots.push(...list));
  }
  indexHotspots();

  let hovered: PartId | null = null;
  let selected: PartId | null = null;
  const selectCbs: ((p: PartId | null) => void)[] = [];
  const hoverCbs: ((p: PartId | null) => void)[] = [];

  function setGlow(part: PartId | null, level: 'none' | 'hover' | 'selected'): void {
    if (!part) return;
    for (const m of rig.hotspots.get(part) ?? []) if (!m.userData.beacon) setHighlight(m, level);
  }

  function refreshGlow(): void {
    for (const p of rig.hotspots.keys()) setGlow(p, 'none');
    if (hovered && hovered !== selected) setGlow(hovered, 'hover');
    if (selected) setGlow(selected, 'selected');
  }

  /** Is this mesh actually on screen (not inside a hidden parent)? */
  function shown(o: THREE.Object3D | null): boolean {
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  }

  function pickPart(ev: PointerEvent): PartId | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(allHotspots, false);
    // Beacons draw on top of everything, so they win when hit.
    const beacon = hits.find((h) => h.object.userData.beacon && shown(h.object));
    if (beacon) return beacon.object.userData.part as PartId;
    for (const h of hits) {
      const part = h.object.userData.part as PartId | undefined;
      if (part && shown(h.object)) return part;
    }
    return null;
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
    const part = pickPart(e);
    if (part && part === selected) rig.poke(part); // re-clicking replays the part's little animation
    selectCbs.forEach((cb) => cb(part));
  });
  canvas.addEventListener('pointermove', (e) => {
    const part = pickPart(e);
    if (part !== hovered) {
      hovered = part;
      canvas.style.cursor = part ? 'pointer' : 'grab';
      refreshGlow();
      hoverCbs.forEach((cb) => cb(part));
    }
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
    // Arc slightly away from the straight line so close-ups swing in rather than slide.
    const lift = Math.min(0.6, p0.distanceTo(p1) * 0.12);
    tween({
      duration: 1100,
      ease: easeInOutCubic,
      tag: 'camera',
      update: (k) => {
        camera.position.lerpVectors(p0, p1, k);
        camera.position.y += Math.sin(k * Math.PI) * lift;
        controls.target.lerpVectors(t0, t1, k);
      },
    });
  }

  function applyLids(part: PartId | null): void {
    const want = new Set<LidId>(part ? PARTS[part].opens ?? [] : []);
    for (const lid of ALL_LIDS) rig.setLid(lid, want.has(lid));
  }

  function flyToPart(part: PartId | null): void {
    if (part) {
      // Shift the target so the part sits left of the side panel.
      const v = rig.views[part];
      const t = new THREE.Vector3(...v.target);
      const p = new THREE.Vector3(...v.pos);
      if (window.innerWidth <= 720) {
        // The panel covers the lower part of the screen: back off and lift the part into view.
        p.sub(t).multiplyScalar(1.35).add(t);
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

  function focus(part: PartId | null): void {
    selected = part;
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
    applyLids(part);
    flyToPart(part);
    refreshGlow();
    rig.focus(part);
    if (part) rig.poke(part);
  }

  // ---------- rebuilds when the case, cooling or GPU changes ----------
  let swapping = false;
  let pending: Setup | null = null;
  let currentSpecs = specs;

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
        rig.setLook(s);
        rig.setSpecs(currentSpecs);
        rig.group.scale.setScalar(0.001);
        scene.add(rig.group);
        syncLineResolution();
        indexHotspots();
        applyLids(selected);
        refreshGlow();
        rig.focus(selected);
        if (selected) flyToPart(selected);
        else {
          const o = overviewFit();
          flyTo(o.pos, o.target);
        }
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
    else rig.setLook(s);
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
    // Beacons pulse, and shrink as the camera closes in so close-ups stay readable.
    const pulse = 1 + Math.sin(t * 3.2) * 0.12;
    rig.beacons.forEach((b, part) => {
      b.visible = part !== selected;
      b.getWorldPosition(tmpV);
      b.scale.setScalar(pulse * Math.min(1, Math.max(0.3, tmpV.distanceTo(camera.position) / 4.5)));
    });
    controls.update();
    camera.updateMatrixWorld();
    keyDir.copy(key.position).sub(key.target.position).normalize();
    shared.uKeyDir.value.copy(keyDir).transformDirection(camera.matrixWorldInverse);
    shared.uUpView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
    renderer.render(scene, camera);
  });

  return {
    focus,
    onSelect: (cb) => selectCbs.push(cb),
    onHover: (cb) => hoverCbs.push(cb),
    setSetup,
    setSpecs(sp) {
      currentSpecs = sp;
      rig.setSpecs(sp);
    },
  };
}
