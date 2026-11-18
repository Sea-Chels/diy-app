const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** Live, so turning the OS setting on mid-visit takes effect without a reload. */
export const reducedMotion = (): boolean => query?.matches ?? false;

export const scrollBehavior = (): ScrollBehavior => (reducedMotion() ? 'auto' : 'smooth');
