import { $, h } from '../shared/dom';
import { icon } from '../shared/icons';
import { onReducedMotionChange, reducedMotion } from '../shared/motion';

/** How long each slide stays up before the next one turns in. */
const SLIDE_MS = 7000;

/**
 * Comic-page carousel. The active dot's progress bar is a CSS animation; when it
 * finishes the next slide turns in, so pausing is just pausing that animation.
 */
export function initCarousel(root: HTMLElement): void {
  const slides = [...root.querySelectorAll<HTMLElement>('.slide')];
  const dotsEl = $('.dots', root);
  const pauseBtn = $<HTMLButtonElement>('.pause', root);
  let index = 0;
  let userPaused = reducedMotion();

  root.style.setProperty('--slide-ms', `${SLIDE_MS}ms`);

  const dots = slides.map((slide, i) => {
    const label = slide.dataset.label ?? '';
    const fill = h('span', { class: 'dot-fill', onAnimationend: () => go(index + 1, 1) });
    const dot = h('button', { type: 'button', class: 'dot hit-pad', 'aria-label': `Slide ${i + 1} of ${slides.length}: ${label}`, onClick: () => go(i, i < index ? -1 : 1) },
      h('span', { class: 'dot-label' }, label),
      h('span', { class: 'dot-bar' }, fill));
    dot.style.setProperty('--ws', slide.style.getPropertyValue('--ws'));
    dotsEl.append(dot);
    return dot;
  });

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}: ${slide.dataset.label}`);
  });

  function go(next: number, dir: 1 | -1): void {
    next = (next + slides.length) % slides.length;
    const prev = slides[index];
    root.dataset.dir = dir > 0 ? 'next' : 'prev';
    if (next !== index) {
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      const done = (e: AnimationEvent) => {
        if (e.target !== prev) return;
        prev.classList.remove('is-leaving');
        prev.removeEventListener('animationend', done);
      };
      prev.addEventListener('animationend', done);
      // Fallback for when animations are off and animationend never fires.
      window.setTimeout(() => prev.classList.remove('is-leaving'), 700);
    }
    index = next;
    show();
  }

  function show(): void {
    slides.forEach((slide, i) => {
      const on = i === index;
      slide.classList.toggle('is-active', on);
      slide.inert = !on;
      slide.setAttribute('aria-hidden', String(!on));
    });
    // Restart the progress bar: drop the class, force a reflow, add it back.
    dots.forEach((d) => d.classList.remove('is-active'));
    void dotsEl.offsetWidth;
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === index);
      if (i === index) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    root.style.setProperty('--ws', slides[index].style.getPropertyValue('--ws'));
  }

  function setUserPaused(paused: boolean): void {
    userPaused = paused;
    root.classList.toggle('user-paused', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    pauseBtn.replaceChildren(icon(paused ? 'play' : 'pause', 18));
  }

  pauseBtn.addEventListener('click', () => setUserPaused(!userPaused));
  root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((btn) => {
    const step = Number(btn.dataset.step) as 1 | -1;
    btn.addEventListener('click', () => go(index + step, step));
  });

  // Hold still while someone is reading or using a slide.
  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') root.classList.add('hover-paused');
  });
  root.addEventListener('pointerleave', () => root.classList.remove('hover-paused'));
  root.addEventListener('focusin', () => root.classList.add('focus-paused'));
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget as Node)) root.classList.remove('focus-paused');
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1, 1);
    else if (e.key === 'ArrowLeft') go(index - 1, -1);
  });

  // Swipe on touch screens.
  let startX = 0;
  let startY = 0;
  root.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });
  root.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    if (e.pointerType !== 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
      go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  });

  // Turning reduced motion on mid-visit stops the autoplay; turning it off starts it again.
  onReducedMotionChange(() => setUserPaused(reducedMotion()));
  setUserPaused(userPaused);
  show();
}
