import { h } from './dom';

/** Lets a run of quick changes (typing a number) settle into one announcement. */
const SETTLE_MS = 400;

let region: HTMLElement | null = null;
let timer = 0;

/**
 * Says `text` through one polite live region. It lives in #modal-root when the page has one,
 * since an open modal makes everything outside that inert, and inert regions go unread.
 */
export function announce(text: string): void {
  if (!region) {
    region = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    (document.getElementById('modal-root') ?? document.body).append(region);
  }
  const r = region;
  clearTimeout(timer);
  // Cleared first so the same text twice in a row is still read.
  r.textContent = '';
  timer = window.setTimeout(() => (r.textContent = text), SETTLE_MS);
}
