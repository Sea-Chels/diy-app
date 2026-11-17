/** Fades out the loading screen injected into every page (see vite.config.ts). */
export function hideLoader(): void {
  const el = document.getElementById('loader');
  if (!el) return;
  el.classList.add('done');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

/** Hide once the canvas has drawn a couple of frames, so the scene appears fully formed. */
export function hideLoaderAfterFrames(n = 2): void {
  const step = () => (n-- > 0 ? requestAnimationFrame(step) : hideLoader());
  requestAnimationFrame(step);
}
