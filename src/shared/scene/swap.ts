import type * as THREE from 'three';
import { easeOutBack, lerp, tween } from '../tween';

export interface SwapOpts<S, R> {
  initial: S;
  build(s: S): R;
  /** Rebuild when this changes. */
  rigKey(s: S): string;
  /** A setup change that keeps the same rig. */
  restyle?(rig: R, s: S): void;
  /** What shrinks and pops back during a rebuild; the whole rig by default. */
  swapTarget?(rig: R): THREE.Object3D;
}

/**
 * Holds the stage's rig. A setup with a new rig key shrinks the old rig away and pops a rebuilt one in, then calls
 * `swapped` with it; one with the same key restyles at once, even mid-swap, so a camera move that follows sees it.
 */
export function createSwap<S, R extends { group: THREE.Group; dispose(): void }>(scene: THREE.Scene, o: SwapOpts<S, R>, swapped: (rig: R) => void) {
  let rig = o.build(o.initial);
  let key = o.rigKey(o.initial);
  scene.add(rig.group);
  const target = (r: R) => o.swapTarget?.(r) ?? r.group;
  let swapping = false;
  /** The newest setup. A swap builds from it, not from what started the swap, so the last choice wins. */
  let latest = o.initial;

  function swap(): void {
    swapping = true;
    const old = rig;
    tween({
      duration: 220,
      ease: (t) => t * t,
      tag: 'swap-out',
      update: (k) => target(old).scale.setScalar(Math.max(0.001, lerp(1, 0, k))),
      done: () => {
        scene.remove(old.group);
        old.dispose();
        key = o.rigKey(latest);
        rig = o.build(latest);
        target(rig).scale.setScalar(0.001);
        scene.add(rig.group);
        swapped(rig);
        tween({
          duration: 560,
          ease: easeOutBack,
          tag: 'swap-in',
          update: (k) => target(rig).scale.setScalar(Math.max(0.001, k)),
          done: () => {
            swapping = false;
            if (o.rigKey(latest) !== key) swap();
          },
        });
      },
    });
  }

  return {
    rig: () => rig,
    /** What a swap scales on the current rig. */
    target: () => target(rig),
    set(s: S): void {
      latest = s;
      if (o.rigKey(s) === key) o.restyle?.(rig, s);
      else if (!swapping) swap();
    },
  };
}
