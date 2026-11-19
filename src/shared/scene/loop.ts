import * as THREE from 'three';
import type { Motion } from '../tween';

/** The longest step the animation clock takes in one frame, in seconds: time spent idle or in a background tab counts as one short step, so whatever starts next starts on time. */
const MAX_STEP = 0.1;

export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.NoToneMapping;
  return renderer;
}

export interface Frame {
  /** Advances everything to `t` seconds and says whether it still moves and whether a shadow caster moved. */
  step(t: number): { moving: boolean; casters: boolean };
  /** Draws the frame; `shadows` when the shadow map has to redraw first. */
  draw(shadows: boolean): void;
}

/**
 * Frames are drawn on demand: whatever changes the picture asks for one, and the frame asks for the next while
 * anything still moves. Returns that ask; 'casters' also redraws the shadow map.
 */
export function createLoop(f: Frame): (m?: Motion) => void {
  let queued = false;
  let shadowsStale = true;
  let timer: THREE.Timer | null = null;
  let skipped = 0;
  function invalidate(m: Motion = 'picture'): void {
    if (m === 'casters') shadowsStale = true;
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }
  function frame(): void {
    queued = false;
    // Started on the first frame, as THREE.Clock did, so animations begin at t = 0 however long the build took.
    timer ??= new THREE.Timer();
    skipped += Math.max(0, timer.update().getDelta() - MAX_STEP);
    const { moving, casters } = f.step(timer.getElapsed() - skipped);
    const shadows = shadowsStale || casters;
    shadowsStale = false;
    f.draw(shadows);
    if (moving) invalidate();
  }
  return invalidate;
}

/** Calls `cb` with the container's size now and whenever it changes. Not laid out yet, it waits: a 0 × 0 aspect would make every camera position NaN. */
export function watchSize(el: HTMLElement, cb: (w: number, h: number) => void): void {
  const measure = () => {
    const { clientWidth: w, clientHeight: h } = el;
    if (w && h) cb(w, h);
  };
  // Watch the container, not the window: the page around it can still be settling (a top bar filling in) after the first measure.
  new ResizeObserver(measure).observe(el);
  measure();
}
