import { h } from './dom';
import { icon } from './icons';

let current: { el: HTMLElement; onClose?: () => void } | null = null;

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeModal();
}

/** One modal at a time; Escape or a click on the backdrop closes it. */
export function openModal(o: { title: string; sub?: string; className?: string; body: HTMLElement; onClose?: () => void }): void {
  closeModal();
  const el: HTMLElement = h(
    'div',
    { class: 'modal-backdrop', onClick: (e) => { if (e.target === el) closeModal(); } },
    h(
      'div',
      { class: `modal ${o.className ?? ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title },
      h('header', { class: 'modal-head' },
        h('div', {}, h('h2', {}, o.title), o.sub ? h('p', { class: 'muted' }, o.sub) : null),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: closeModal }, icon('close'))),
      o.body,
    ),
  );
  document.getElementById('modal-root')!.append(el);
  document.addEventListener('keydown', onKey);
  current = { el, onClose: o.onClose };
}

export function closeModal(): void {
  if (!current) return;
  const { el, onClose } = current;
  current = null;
  el.remove();
  document.removeEventListener('keydown', onKey);
  onClose?.();
}
