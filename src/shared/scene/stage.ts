import * as THREE from 'three';
import { onTweenStart, updateTweens, cancelTweens, type Motion } from '../tween';
import { onReducedMotionChange, reducedMotion } from '../motion';
import { lineMaterials, shared } from '../toon';
import { createOutlinePass } from './outline';
import type { V3 } from './kit';
import { media } from '../media';
import { clearance, frameView, type Framing, type Insets } from './framing';
import { addGround, addLights, type Ground, type Lighting } from './lights';
import { createLoop, createRenderer, watchSize } from './loop';
import { createPicker, onPointer, showGlow } from './picking';
import { createControls, fitOverview, flyTo, type ControlsOpts, type Fit, type Flight } from './camera';
import { createSwap, type SwapOpts } from './swap';
import { tagOf } from './sceneTags';

export interface View {
  pos: V3;
  target: V3;
}

/**
 * What a workshop's 3D model gives the stage. Pick meshes are tagged with their spot (see sceneTags.ts);
 * beacons are also tagged `beacon`, and `blocker` marks a surface that hides any pick behind it.
 */
export interface StageRig<Id extends string, Lid extends string> {
  group: THREE.Group;
  picks: THREE.Object3D[];
  /** Meshes highlighted when a spot is hovered or selected. */
  glow: Map<Id, THREE.Mesh[]>;
  beacons: Map<Id, THREE.Mesh>;
  views: Record<Id, View>;
  overview: View;
  setLid(lid: Lid, open: boolean): void;
  focus?(id: Id | null): void;
  /** False while a spot can't be clicked, e.g. it's behind a closed lid; picks pass through it. */
  canPick?(id: Id): boolean;
  /** Play a spot's small animation, if it has one. */
  poke(id: Id): void;
  /** Advances ambient animation to `t` seconds and says what moved, so the stage keeps drawing frames (and shadows) while it does. */
  update(t: number): Motion;
  dispose(): void;
}

export interface StageConfig<S, Id extends string, Lid extends string, R extends StageRig<Id, Lid>> extends SwapOpts<S, R>, Lighting {
  lids: readonly Lid[];
  opens(id: Id): readonly Lid[] | undefined;
  /** 'hull' recolors each mesh's ink; 'outline' draws one rim round the whole spot. */
  highlight: 'hull' | 'outline';
  /** Fly back to the current view once a rebuilt rig is in. */
  reflyOnSwap?: boolean;
  /** Camera near plane; as large as close-ups allow, for depth precision. */
  near: number;
  controls: ControlsOpts;
  ground: Ground;
  fit: Fit;
  flight: Flight;
  /**
   * How spot views make room for the side panel: pulled back by `pullback`, then on desktop
   * shifted left by `shift` × distance. On phones the panel covers the bottom of the screen,
   * so the view slides down until its target sits in the middle of what's left above it.
   */
  framing: Framing;
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
  /** Draw a fresh frame, shadows included, after changing the rig from outside the stage. */
  invalidate(): void;
}

export function createStage<S, Id extends string, Lid extends string, R extends StageRig<Id, Lid>>(
  canvas: HTMLCanvasElement,
  cfg: StageConfig<S, Id, Lid, R>,
): Stage<S, Id, R> {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, cfg.near, 100);
  const controls = createControls(camera, canvas, cfg.controls);
  const key = addLights(scene, cfg);
  addGround(scene, cfg.ground);

  const invalidate = createLoop({ step, draw });
  onTweenStart(() => invalidate());
  onReducedMotionChange(() => invalidate());

  let hovered: Id | null = null;
  let selected: Id | null = null;
  const selectCbs: ((id: Id | null) => void)[] = [];
  const hoverCbs: ((id: Id | null) => void)[] = [];

  const swap = createSwap(scene, cfg, (r) => {
    syncLineResolution();
    applyLids(selected);
    refreshGlow();
    r.focus?.(selected);
    if (cfg.reflyOnSwap) flyTo(camera, controls, selected ? framed(selected) : overviewFit(), cfg.flight);
  });
  const rig = swap.rig;

  const overviewFit = () => fitOverview(rig().overview, camera.aspect, cfg.fit, controls, cfg.controls.maxDistance);
  const onPhone = media('phone');
  const panelEl = document.getElementById('panel');
  const overlayEl = document.querySelector<HTMLElement>('.scene-menu');
  const insets = (): Insets => ({
    height: canvas.clientHeight,
    top: overlayEl ? overlayEl.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top : 0,
    bottom: panelEl?.offsetHeight ?? 0,
  });
  const framed = (id: Id) =>
    frameView(rig().views[id], camera.fov, onPhone.matches, insets(), cfg.framing, (from, dir, far) => clearance(scene, swap.target(), from, dir, far));

  function refreshGlow(): void {
    invalidate();
    showGlow(rig().glow, cfg.highlight, hovered, selected);
  }

  onPointer(canvas, createPicker<Id>(canvas, camera, rig, () => selected), {
    tap(hit) {
      // Tapping the selected spot again lets go of it (its model can fill a phone screen); its beacon plays its animation instead.
      if (hit?.id === selected && hit?.beacon) {
        rig().poke(hit.id);
        return invalidate();
      }
      const id = hit && hit.id !== selected ? hit.id : null;
      selectCbs.forEach((cb) => cb(id));
    },
    move(id) {
      if (id === hovered) return;
      hovered = id;
      canvas.style.cursor = id ? 'pointer' : 'grab';
      refreshGlow();
      hoverCbs.forEach((cb) => cb(id));
    },
    leave() {
      hovered = null;
      refreshGlow();
      hoverCbs.forEach((cb) => cb(null));
    },
  });

  let idleTimer: number | undefined;
  const resumeSpin = () => {
    controls.autoRotate = !reducedMotion();
    invalidate();
  };
  controls.addEventListener('change', () => invalidate());
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    cancelTweens('camera');
    window.clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!selected) resumeSpin();
    }, 9000);
  });

  function applyLids(id: Id | null): void {
    const want = new Set<Lid>(id ? cfg.opens(id) ?? [] : []);
    for (const lid of cfg.lids) rig().setLid(lid, want.has(lid));
  }

  function focus(id: Id | null): void {
    selected = id;
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
    applyLids(id);
    if (id) flyTo(camera, controls, framed(id), cfg.flight);
    else {
      flyTo(camera, controls, overviewFit(), cfg.flight);
      idleTimer = window.setTimeout(resumeSpin, 4000);
    }
    refreshGlow();
    rig().focus?.(id);
    if (id) rig().poke(id);
  }

  const container = canvas.parentElement ?? canvas;
  function syncLineResolution(): void {
    lineMaterials.forEach((m) => m.resolution.set(container.clientWidth, container.clientHeight));
  }
  const outline = cfg.highlight === 'outline' ? createOutlinePass(renderer) : null;
  watchSize(container, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    shared.uDotSize.value = 5.5 * pr;
    outline?.setSize(w, h, pr);
    syncLineResolution();
    invalidate();
  });
  const start = overviewFit();
  camera.position.set(...start.pos);
  controls.target.set(...start.target);

  const keyDir = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  function step(t: number): { moving: boolean; casters: boolean } {
    const tweened = updateTweens(performance.now());
    const r = rig();
    const ambient = r.update(t);
    let moving = Boolean(tweened || ambient);
    const still = reducedMotion() || !cfg.beaconPulse.amp;
    const pulse = still ? 1 : 1 + Math.sin(t * cfg.beaconPulse.speed) * cfg.beaconPulse.amp;
    const bs = cfg.beaconScale;
    r.beacons.forEach((b, id) => {
      // Beacons draw without depth testing, so ones on the far side of an outer wall have to hide themselves.
      const seen = tagOf(b, 'seen');
      b.visible = id !== selected && (!seen || seen(camera.position));
      if (b.visible && !still) moving = true;
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
    return { moving, casters: tweened === 'casters' || ambient === 'casters' };
  }
  function draw(shadows: boolean): void {
    renderer.shadowMap.needsUpdate = shadows;
    renderer.render(scene, camera);
    if (outline && (hovered || selected)) outline.render(scene, camera);
  }
  invalidate();
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>)[`__${cfg.debugName}`] = { renderer, camera, controls, scene };

  return {
    focus,
    onSelect: (cb) => selectCbs.push(cb),
    onHover: (cb) => hoverCbs.push(cb),
    setSetup(s) {
      invalidate('casters');
      swap.set(s);
    },
    rig,
    invalidate: () => invalidate('casters'),
  };
}
