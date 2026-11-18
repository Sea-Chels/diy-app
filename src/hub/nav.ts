/** Mobile menu toggle: closes on a link, on Escape, and hands focus back to the toggle. */
export function initNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle')!;
  const links = document.getElementById('nav-links')!;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
    if (links.contains(document.activeElement)) toggle.focus();
    setOpen(false);
  });
}
