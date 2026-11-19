import { reducedMotion } from './motion';

/** Minimal tween runner. Call `updateTweens(now)` once per frame. With reduced motion on, every tween jumps to its end. */
export type Ease = (t: number) => number;
export const easeInOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack: Ease = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

/** What a frame changed: nothing, only the picture, or something that casts a shadow (so the shadow map redraws too). */
export type Motion = false | 'picture' | 'casters';

interface Tween {
  start: number;
  duration: number;
  ease: Ease;
  update: (k: number) => void;
  done?: () => void;
  tag?: string;
  shadows?: false;
}

const active: Tween[] = [];
let wake = (): void => {};

/** Called whenever a tween starts, so an idle scene can start drawing frames again. */
export function onTweenStart(cb: () => void): void {
  wake = cb;
}

/** Pass `shadows: false` for tweens that move nothing casting a shadow (the camera, a color). */
export function tween(opts: { duration: number; ease?: Ease; update: (k: number) => void; done?: () => void; tag?: string; shadows?: false }): void {
  if (opts.tag) cancelTweens(opts.tag);
  // Still frame-driven when instant: callers start tweens before the canvas has a size.
  const duration = reducedMotion() ? 1e-3 : Math.max(opts.duration, 1e-3);
  active.push({ ...opts, start: performance.now(), duration, ease: opts.ease ?? easeInOutCubic });
  wake();
}

export function cancelTweens(tag: string): void {
  for (let i = active.length - 1; i >= 0; i--) if (active[i].tag === tag) active.splice(i, 1);
}

/** Advances every tween to `now`, and says what the ones that ran changed. */
export function updateTweens(now: number): Motion {
  let m: Motion = false;
  for (let i = active.length - 1; i >= 0; i--) {
    const t = active[i];
    if (m !== 'casters') m = t.shadows === false ? 'picture' : 'casters';
    const k = Math.min(1, (now - t.start) / t.duration);
    t.update(t.ease(k));
    if (k >= 1) {
      active.splice(i, 1);
      t.done?.();
    }
  }
  return m;
}

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
