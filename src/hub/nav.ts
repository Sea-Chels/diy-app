import type { Carousel } from './carousel';

/** Mobile menu toggle, plus "Soon" links that jump the carousel to their slide. */
export function initNav(carousel: Carousel): void {
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
    if (e.key === 'Escape') setOpen(false);
  });

  links.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      carousel.goTo(btn.dataset.goto!);
      document.getElementById('carousel')!.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
