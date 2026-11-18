import { h } from './dom';
import { focusables } from './focus';
import { icon } from './icons';

let current: { el: HTMLElement; dialog: HTMLElement; opener: Element | null; inert: HTMLElement[]; onClose: (() => void) | undefined } | null = null;

function onKey(e: KeyboardEvent): void {
  if (!current) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  } else if (e.key === 'Tab') {
    const items = focusables(current.dialog);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || at === current.dialog)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/** Makes everything outside `keep` inert (its siblings, and its ancestors' siblings); returns what it changed. */
function inertAround(keep: HTMLElement): HTMLElement[] {
  const changed: HTMLElement[] = [];
  for (let el = keep; el.parentElement && el !== document.body; el = el.parentElement) {
    for (const sib of el.parentElement.children) {
      if (sib !== el && sib instanceof HTMLElement && !sib.inert) {
        sib.inert = true;
        changed.push(sib);
      }
    }
  }
  return changed;
}

/**
 * One modal at a time; Escape or a click on the backdrop closes it. While open, the rest of
 * the page is inert and Tab stays inside; closing hands focus back to whatever opened it.
 */
export function openModal(o: { title: string; sub?: string; className?: string; body: HTMLElement; onClose?: () => void }): void {
  const opener = current?.opener ?? document.activeElement;
  closeModal(false);
  const dialog = h(
    'div',
    { class: `modal ${o.className ?? ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title, tabindex: '-1' },
    h('header', { class: 'modal-head' },
      h('div', {}, h('h2', {}, o.title), o.sub ? h('p', { class: 'muted' }, o.sub) : null),
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: () => closeModal() }, icon('close'))),
    o.body,
  );
  const el: HTMLElement = h('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === el) closeModal(); } }, dialog);
  const root = document.getElementById('modal-root')!;
  root.append(el);
  const inert = inertAround(root);
  document.addEventListener('keydown', onKey);
  current = { el, dialog, opener, inert, onClose: o.onClose };
  dialog.focus({ preventScroll: true });
}

export function closeModal(restoreFocus = true): void {
  if (!current) return;
  const { el, opener, inert, onClose } = current;
  current = null;
  for (const c of inert) c.inert = false;
  el.remove();
  document.removeEventListener('keydown', onKey);
  onClose?.();
  if (restoreFocus && opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
}
