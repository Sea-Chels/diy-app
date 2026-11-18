import { h } from '../dom';
import { icon, type IconName } from '../icons';

/** The floating menu in a workshop's top-left corner: a toggle, and a card under it that Escape or a click elsewhere closes. */
export function sceneMenu(root: HTMLElement, o: { id: string; icon: IconName; label: string; title: string }) {
  const toggle = h('button', { class: 'paint-toggle', 'aria-expanded': 'false', 'aria-controls': o.id }, icon(o.icon, 16), h('span', {}, o.label), h('span', { class: 'paint-dot' }));
  const card = h('div', { class: 'paint-card', id: o.id, role: 'group', 'aria-label': o.title });
  root.append(toggle, card);

  function setOpen(open: boolean): void {
    root.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setOpen(!root.classList.contains('open')));
  document.addEventListener('pointerdown', (e) => {
    if (!root.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !root.classList.contains('open')) return;
    if (card.contains(document.activeElement)) toggle.focus();
    setOpen(false);
  });
  return { toggle, card };
}
