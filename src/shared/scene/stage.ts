import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { tween, updateTweens, cancelTweens, easeInOutCubic, easeOutBack, lerp } from '../tween';
import { reducedMotion } from '../motion';
import { media } from '../media';
import { lineMaterials, setHighlight, shared } from '../toon';
import { hex, LIGHT } from '../theme';
import { createOutlinePass, HOVER_LAYER, SELECT_LAYER } from './outline';
import type { V3 } from './kit';
import { MAT } from './materials';

const UP = new THREE.Vector3(0, 1, 0);
/** World units a pulled-back camera keeps from the surface it backed up to. */
const CLEAR_MARGIN = 0.15;

export interface View {
  pos: V3;
  target: V3;
}

/**
 * What a workshop's 3D model gives the stage. Pick meshes carry `userData.area`;
 * beacons also carry `userData.beacon`, and `userData.blocker` marks a surface
 * that hides any pick behind it.
 */
export interface StageRig<Id extends string, Lid extends string> {
  /** Rebuild when this changes. */
  key: string;
  group: THREE.Group;
  picks: THREE.Object3D[];
  /** Meshes highlighted when an area is hovered or selected. */
  glow: Map<Id, THREE.Mesh[]>;
  beacons: Map<Id, THREE.Mesh>;
  views: Record<Id, View>;
  overview: View;
  setLid(lid: Lid, open: boolean): void;
  focus?(id: Id | null): void;
  /** False while an area can't be clicked, e.g. it's behind a closed lid; picks pass through it. */
  canPick?(id: Id): boolean;
  /** Play an area's small animation, if it has one. */
  poke(id: Id): void;
  update(t: number): void;
  dispose(): void;
}

export interface StageConfig<S, Id extends string, Lid extends string, R extends StageRig<Id, Lid>> {
  initial: S;
  build(s: S): R;
  rigKey(s: S): string;
  /** A setup change that keeps the same rig. */
  restyle?(rig: R, s: S): void;
  /** What shrinks and pops back during a rebuild; the whole rig by default. */
  swapTarget?(rig: R): THREE.Object3D;
  lids: readonly Lid[];
  opens(id: Id): readonly Lid[] | undefined;
  /** 'hull' recolors each mesh's ink; 'outline' draws one rim round the whole area. */
  highlight: 'hull' | 'outline';
  /** Fly back to the current view once a rebuilt rig is in. */
  reflyOnSwap?: boolean;
  /** Camera near plane; as large as close-ups allow, for depth precision. */
  near: number;
  controls: { minDistance: number; maxDistance: number; polarMargin: number; pan: boolean; rotateSpeed: number };
  sky: { color: number; intensity: number };
  key: { pos: V3; intensity: number; shadowMap: number; shadowExtent: number; shadowFar: number; bias: number };
  rims: { pink: { pos: V3; intensity: number }; cyan: { pos: V3; intensity: number } };
  front: { pos: V3; intensity: number };
  ground: { center: V3; disc?: number; ring: [number, number]; ringY: number; segments: number };
  /**
   * Overview distance multiplier: clamp(base / aspect, min, max), so portrait screens back off.
   * `raiseLimit` lets that push past controls.maxDistance; without it the overview is clamped to the limit.
   */
  fit: { base: number; min: number; max: number; raiseLimit: boolean };
  flight: { ms: number; lift: number };
  /**
   * How area views make room for the side panel: pulled back by `pullback`, then on desktop
   * shifted left by `shift` × distance. On phones the panel covers the bottom of the screen,
   * so the view slides down until its target sits in the middle of what's left above it.
   */
  framing: { desktop: { pullback: number; shift: number }; phone: { pullback: number } };
  beaconPulse: { amp: number; speed: number };
  /** Beacons shrink as the camera closes in: scale = clamp(distance / near, 0.3, max). Null keeps them one size. */
  beaconScale: { near: number; max: number } | null;
  debugName: string;
}

export interface Stage<S, Id extends string, R> {
  focus(id: Id | null): void;
  onSelect(cb: (id: Id | null) => void): void;
  onHover(cb: (id: Id | null) => void): void;
  setSetup(s: S): void;
  rig(): R;
}

const shown = (o: THREE.Object3D | null): boolean => {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
};

export function createStage<S, Id extends string, Lid extends string, R extends StageRig<Id, Lid>>(
  canvas: HTMLCanvasElement,
  cfg: StageConfig<S, Id, Lid, R>,
): Stage<S, Id, R> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, cfg.near, 100);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = cfg.controls.minDistance;
  controls.maxDistance = cfg.controls.maxDistance;
  controls.maxPolarAngle = Math.PI / 2 - cfg.controls.polarMargin;
  controls.enablePan = cfg.controls.pan;
  controls.autoRotate = !reducedMotion();
  controls.autoRotateSpeed = cfg.controls.rotateSpeed;

  scene.add(new THREE.HemisphereLight(cfg.sky.color, LIGHT.ground, cfg.sky.intensity));
  const key = new THREE.DirectionalLight(LIGHT.key, cfg.key.intensity);
  key.position.set(...cfg.key.pos);
  key.castShadow = true;
  key.shadow.mapSize.set(cfg.key.shadowMap, cfg.key.shadowMap);
  key.shadow.camera.left = key.shadow.camera.bottom = -cfg.key.shadowExtent;
  key.shadow.camera.right = key.shadow.camera.top = cfg.key.shadowExtent;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = cfg.key.shadowFar;
  key.shadow.bias = cfg.key.bias;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  for (const [color, rim] of [[LIGHT.rimPink, cfg.rims.pink], [LIGHT.rimCyan, cfg.rims.cyan]] as const) {
    const l = new THREE.DirectionalLight(color, rim.intensity);
    l.position.set(...rim.pos);
    scene.add(l);
  }
  const front = new THREE.DirectionalLight(LIGHT.front, cfg.front.intensity);
  front.position.set(...cfg.front.pos);
  scene.add(front);

  const g = cfg.ground;
  if (g.disc) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(g.disc, g.segments), MAT.ground());
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(...g.center);
    disc.receiveShadow = true;
    scene.add(disc);
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(g.ring[0], g.ring[1], g.segments),
    new THREE.MeshBasicMaterial({ color: hex('bg'), transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(g.center[0], g.ringY, g.center[2]);
  scene.add(ring);

  let rig = cfg.build(cfg.initial);
  scene.add(rig.group);
  const swapped = (r: R) => cfg.swapTarget?.(r) ?? r.group;

  function overviewFit(): View {
    const { pos, target } = rig.overview;
    const k = Math.min(cfg.fit.max, Math.max(cfg.fit.min, cfg.fit.base / camera.aspect));
    const t = new THREE.Vector3(...target);
    const p = new THREE.Vector3(...pos).sub(t).multiplyScalar(k).add(t);
    if (cfg.fit.raiseLimit) controls.maxDistance = Math.max(cfg.controls.maxDistance, p.distanceTo(t) * 1.15);
    return { pos: [p.x, p.y, p.z], target };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered: Id | null = null;
  let selected: Id | null = null;
  const selectCbs: ((id: Id | null) => void)[] = [];
  const hoverCbs: ((id: Id | null) => void)[] = [];

  function setGlow(id: Id | null, level: 'none' | 'hover' | 'selected'): void {
    if (!id) return;
    for (const m of rig.glow.get(id) ?? []) {
      if (cfg.highlight === 'hull') {
        setHighlight(m, level);
        continue;
      }
      m.layers.disable(HOVER_LAYER);
      m.layers.disable(SELECT_LAYER);
      if (level === 'hover') m.layers.enable(HOVER_LAYER);
      if (level === 'selected') m.layers.enable(SELECT_LAYER);
    }
  }
  function refreshGlow(): void {
    for (const id of rig.glow.keys()) setGlow(id, 'none');
    if (hovered && hovered !== selected) setGlow(hovered, 'hover');
    if (selected) setGlow(selected, 'selected');
  }

  /** The area under the pointer, and whether it was its beacon that was hit. */
  function pick(ev: PointerEvent): { id: Id; beacon: boolean } | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const areaOf = (o: THREE.Object3D) => (o.userData.area as Id | undefined) ?? meshArea.get(o);
    const live = (o: THREE.Object3D) => shown(o) && (!rig.canPick || o.userData.blocker || rig.canPick(areaOf(o) as Id));
    const hits = raycaster.intersectObjects(selected ? closePicks() : rig.picks, false);
    // Beacons draw on top of everything, so they win when hit.
    const beacon = hits.find((h) => h.object.userData.beacon && live(h.object));
    if (beacon) return { id: areaOf(beacon.object) as Id, beacon: true };
    // Pick boxes overlap: the nearest wins, unless a blocker is in front of it.
    const first = hits.find((h) => !h.object.userData.beacon && live(h.object));
    if (!first || first.object.userData.blocker) return null;
    const id = areaOf(first.object);
    return id ? { id, beacon: false } : null;
  }

  // Zoomed in, a spot's generous pick box can fill the screen and leave nothing to tap to get out, so while
  // something is selected only the models themselves (and beacons and blockers) pick.
  let meshArea = new Map<THREE.Object3D, Id>();
  let closeFor: R | null = null;
  let close: THREE.Object3D[] = [];
  function closePicks(): THREE.Object3D[] {
    if (closeFor !== rig) {
      closeFor = rig;
      meshArea = new Map();
      for (const [id, ms] of rig.glow) for (const m of ms) meshArea.set(m, id);
      close = [...rig.picks.filter((o) => o.userData.beacon || o.userData.blocker), ...meshArea.keys()];
    }
    return close;
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
    const hit = pick(e);
    // Tapping the selected area again lets go of it (its model can fill a phone screen); its beacon plays its animation instead.
    if (hit?.id === selected && hit?.beacon) return rig.poke(hit.id);
    const id = hit && hit.id !== selected ? hit.id : null;
    selectCbs.forEach((cb) => cb(id));
  });
  let moveQueued = false;
  canvas.addEventListener('pointermove', (e) => {
    if (moveQueued) return;
    moveQueued = true;
    requestAnimationFrame(() => {
      moveQueued = false;
      const id = pick(e)?.id ?? null;
      if (id === hovered) return;
      hovered = id;
      canvas.style.cursor = id ? 'pointer' : 'grab';
      refreshGlow();
      hoverCbs.forEach((cb) => cb(id));
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
    cancelTweens('camera');
    window.clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!selected) controls.autoRotate = !reducedMotion();
    }, 9000);
  });

  function flyTo({ pos, target }: View): void {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...pos);
    const t1 = new THREE.Vector3(...target);
    // Arc slightly away from the straight line so close-ups swing in rather than slide.
    const lift = Math.min(cfg.flight.lift, p0.distanceTo(p1) * 0.12);
    tween({
      duration: cfg.flight.ms,
      ease: easeInOutCubic,
      tag: 'camera',
      update: (k) => {
        camera.position.lerpVectors(p0, p1, k);
        camera.position.y += Math.sin(k * Math.PI) * lift;
        controls.target.lerpVectors(t0, t1, k);
      },
    });
  }

  const sight = new THREE.Raycaster();
  /**
   * How far a camera can back away from `from` along `dir` (up to `far`) and still see `from`.
   * The ray runs back from the far end, so it only meets faces turned toward that camera: a
   * one-sided cutaway wall seen from behind doesn't count, but the inside of a closed object's
   * ink hull (which would fill the screen) does. Glass, pick boxes and beacons never block.
   * It tests the rig at full size: a view can be framed before the first render or mid swap-in.
   */
  function clearance(from: THREE.Vector3, dir: THREE.Vector3, far: number): number {
    const grow = swapped(rig).scale;
    const scale = grow.x;
    grow.setScalar(1);
    scene.updateMatrixWorld();
    sight.set(new THREE.Vector3().copy(from).addScaledVector(dir, far), new THREE.Vector3().copy(dir).negate());
    sight.far = far;
    const hits = sight.intersectObject(scene, true);
    // Hulls opt out of raycasting so they never take a click; ask them directly.
    scene.traverse((o) => {
      if (!o.userData.ink || !shown(o)) return;
      const proto = (o as THREE.InstancedMesh).isInstancedMesh ? THREE.InstancedMesh.prototype : THREE.Mesh.prototype;
      proto.raycast.call(o as THREE.Mesh, sight, hits);
    });
    let nearest = far;
    for (const { object: o, distance } of hits) {
      const m = o as THREE.Mesh;
      const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material | undefined;
      if (m.isMesh && mat?.visible && !(mat.transparent && mat.opacity < 0.9) && !o.userData.beacon && shown(o)) nearest = Math.min(nearest, far - distance);
    }
    grow.setScalar(scale);
    scene.updateMatrixWorld();
    return nearest;
  }

  const onPhone = media('phone');
  const panelEl = document.getElementById('panel');
  const overlayEl = document.querySelector<HTMLElement>('.scene-menu');
  /** An area's view, nudged clear of the side panel (right on desktop, bottom on phones). */
  function framed(id: Id): View {
    const v = rig.views[id];
    const t = new THREE.Vector3(...v.target);
    const p = new THREE.Vector3(...v.pos);
    const { desktop, phone } = cfg.framing;
    if (onPhone.matches) {
      // The view slides down along the camera's own up (for a view looking into an engine bay, world down points into the screen)
      // until the target sits mid-strip between the floating top controls and the panel, `covered` half-heights above screen center.
      const authored = p.distanceTo(t);
      const back = new THREE.Vector3().subVectors(p, t).normalize();
      const side = new THREE.Vector3().crossVectors(back, UP).negate();
      // Straight down (or up) has no side; three's lookAt then turns screen-up to ∓z.
      const up = side.lengthSq() < 1e-12 ? new THREE.Vector3(0, 0, -Math.sign(back.y)) : new THREE.Vector3().crossVectors(side, back.clone().negate()).normalize();
      const h = canvas.clientHeight;
      const top = overlayEl && h ? (overlayEl.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top) / h : 0;
      const covered = h ? (panelEl ? panelEl.offsetHeight / h : 0) - top : 0;
      const slide = up.multiplyScalar(-Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * covered);
      // Both moves grow with distance, so the camera sits on one line, target + (back + slide) × distance. Pull back along it
      // to fit the short strip, stopping short of anything in the way (the car beside a motorcycle view).
      const path = new THREE.Vector3().addVectors(back, slide);
      const step = path.length();
      path.normalize();
      const start = new THREE.Vector3().copy(t).addScaledVector(path, authored * step);
      const extra = authored * step * (phone.pullback - 1);
      const dist = authored + Math.max(0, Math.min(extra, clearance(start, path, extra) - CLEAR_MARGIN)) / step;
      p.copy(t).addScaledVector(path, dist * step);
      t.addScaledVector(slide, dist);
    } else {
      p.sub(t).multiplyScalar(desktop.pullback).add(t);
      const right = new THREE.Vector3().subVectors(t, p).cross(new THREE.Vector3(0, 1, 0)).normalize();
      const shift = right.multiplyScalar(p.distanceTo(t) * desktop.shift);
      t.add(shift);
      p.add(shift);
    }
    return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
  }

  function flyToArea(id: Id | null): void {
    if (id) {
      flyTo(framed(id));
      return;
    }
    flyTo(overviewFit());
    idleTimer = window.setTimeout(() => (controls.autoRotate = !reducedMotion()), 4000);
  }

  function applyLids(id: Id | null): void {
    const want = new Set<Lid>(id ? cfg.opens(id) ?? [] : []);
    for (const lid of cfg.lids) rig.setLid(lid, want.has(lid));
  }

  function focus(id: Id | null): void {
    selected = id;
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
    applyLids(id);
    flyToArea(id);
    refreshGlow();
    rig.focus?.(id);
    if (id) rig.poke(id);
  }

  let swapping = false;
  let pending: S | null = null;

  function swap(s: S): void {
    swapping = true;
    const old = rig;
    tween({
      duration: 220,
      ease: (t) => t * t,
      tag: 'swap-out',
      update: (k) => swapped(old).scale.setScalar(Math.max(0.001, lerp(1, 0, k))),
      done: () => {
        scene.remove(old.group);
        old.dispose();
        rig = cfg.build(s);
        swapped(rig).scale.setScalar(0.001);
        scene.add(rig.group);
        syncLineResolution();
        applyLids(selected);
        refreshGlow();
        rig.focus?.(selected);
        if (cfg.reflyOnSwap) flyTo(selected ? framed(selected) : overviewFit());
        tween({
          duration: 560,
          ease: easeOutBack,
          tag: 'swap-in',
          update: (k) => swapped(rig).scale.setScalar(Math.max(0.001, k)),
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

  function setSetup(s: S): void {
    if (swapping) {
      pending = s;
      return;
    }
    if (cfg.rigKey(s) !== rig.key) swap(s);
    else cfg.restyle?.(rig, s);
  }

  function syncLineResolution(): void {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement ?? canvas;
    lineMaterials.forEach((m) => m.resolution.set(w, h));
  }
  const outline = cfg.highlight === 'outline' ? createOutlinePass(renderer) : null;

  function resize(): void {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement ?? canvas;
    // Not laid out yet: a 0 × 0 aspect would make every camera position NaN. The observer calls again.
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    shared.uDotSize.value = 5.5 * pr;
    outline?.setSize(w, h, pr);
    syncLineResolution();
  }
  // Watch the container, not the window: the page around it can still be settling (a top bar filling in) after the first measure.
  new ResizeObserver(resize).observe(canvas.parentElement ?? canvas);
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
    const pulse = reducedMotion() ? 1 : 1 + Math.sin(t * cfg.beaconPulse.speed) * cfg.beaconPulse.amp;
    const bs = cfg.beaconScale;
    rig.beacons.forEach((b, id) => {
      // Beacons draw without depth testing, so ones on the far side of an outer wall have to hide themselves.
      const seen = b.userData.seen as ((cam: THREE.Vector3) => boolean) | undefined;
      b.visible = id !== selected && (!seen || seen(camera.position));
      if (!bs) {
        b.scale.setScalar(pulse);
        return;
      }
      b.getWorldPosition(tmpV);
      b.scale.setScalar(pulse * Math.min(bs.max, Math.max(0.3, tmpV.distanceTo(camera.position) / bs.near)));
    });
    controls.update();
    camera.updateMatrixWorld();
    keyDir.copy(key.position).sub(key.target.position).normalize();
    shared.uKeyDir.value.copy(keyDir).transformDirection(camera.matrixWorldInverse);
    shared.uUpView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
    renderer.render(scene, camera);
    if (outline && (hovered || selected)) outline.render(scene, camera);
  });
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>)[`__${cfg.debugName}`] = { renderer, camera, controls, scene };

  return {
    focus,
    onSelect: (cb) => selectCbs.push(cb),
    onHover: (cb) => hoverCbs.push(cb),
    setSetup,
    rig: () => rig,
  };
}
