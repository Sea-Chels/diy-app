const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** Live, so turning the OS setting on mid-visit takes effect without a reload. */
export const reducedMotion = (): boolean => query?.matches ?? false;

export const onReducedMotionChange = (cb: () => void): void => query?.addEventListener('change', cb);

/**
 * A clock for idle loops (fans, drips, wind, bugs): the frame time less however long reduced
 * motion has been on, so they hold still while it is and pick up where they stopped after.
 */
export function idleClock(): (t: number) => number {
  let last = 0;
  let held = 0;
  return (t) => {
    if (reducedMotion()) held += t - last;
    last = t;
    return t - held;
  };
}

export const scrollBehavior = (): ScrollBehavior => (reducedMotion() ? 'auto' : 'smooth');
