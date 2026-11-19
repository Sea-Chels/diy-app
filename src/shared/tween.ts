import { reducedMotion } from './motion';

/** Minimal tween runner. Call `updateTweens(now)` once per frame. With reduced motion on, every tween jumps to its end. */
export type Ease = (t: number) => number;
export const easeInOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack: Ease = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

/** What a frame changed: nothing, only the picture, or something that casts a shadow (so the shadow map redraws too). */
export type Motion = false | 'picture' | 'casters';

interface TweenOpts {
  duration: number;
  ease?: Ease;
  update: (k: number) => void;
  done?: () => void;
  /** A new tween cancels any running one with the same tag and owner. */
  tag?: string;
  shadows?: false;
}

interface Tween extends TweenOpts {
  start: number;
  ease: Ease;
  owner: object | null;
}

const active: Tween[] = [];
let wake = (): void => {};

/** Called whenever a tween starts, so an idle scene can start drawing frames again. */
export function onTweenStart(cb: () => void): void {
  wake = cb;
}

function start(opts: TweenOpts, owner: object | null): void {
  if (opts.tag) cancel(opts.tag, owner);
  // Still frame-driven when instant: callers start tweens before the canvas has a size.
  const duration = reducedMotion() ? 1e-3 : Math.max(opts.duration, 1e-3);
  active.push({ ...opts, start: performance.now(), duration, ease: opts.ease ?? easeInOutCubic, owner });
  wake();
}

/** Stops the owner's tweens with `tag`, or all of them. */
function cancel(tag: string | null, owner: object | null): void {
  for (let i = active.length - 1; i >= 0; i--) if (active[i].owner === owner && (tag === null || active[i].tag === tag)) active.splice(i, 1);
}

/** A stage-wide tween. Pass `shadows: false` for tweens that move nothing casting a shadow (the camera, a color). */
export const tween = (opts: TweenOpts): void => start(opts, null);

export const cancelTweens = (tag: string): void => cancel(tag, null);

/** Tweens owned by one rig: their tags only clash with each other, and `stop` ends them all when the rig goes. */
export function tweenScope() {
  const owner = {};
  return { tween: (opts: TweenOpts) => start(opts, owner), stop: () => cancel(null, owner) };
}

export type TweenScope = ReturnType<typeof tweenScope>;

/** Advances every tween to `now`, and says what the ones that ran changed. */
export function updateTweens(now: number): Motion {
  let m: Motion = false;
  // A tween's update or done can start or cancel others, so walk a copy and drop finished ones by identity.
  for (const t of active.slice().reverse()) {
    if (!active.includes(t)) continue;
    if (m !== 'casters') m = t.shadows === false ? 'picture' : 'casters';
    const k = Math.min(1, (now - t.start) / t.duration);
    t.update(t.ease(k));
    if (k >= 1) {
      active.splice(active.indexOf(t), 1);
      t.done?.();
    }
  }
  return m;
}

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
