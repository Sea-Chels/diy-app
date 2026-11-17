import { icon } from '../shared/icons';

/** How long each slide stays up before the next one turns in. */
const SLIDE_MS = 7000;

export interface Carousel {
  goTo(id: string): void;
}

/**
 * Comic-page carousel. The active dot's progress bar is a CSS animation; when it
 * finishes the next slide turns in, so pausing is just pausing that animation.
 */
export function initCarousel(root: HTMLElement): Carousel {
  const slides = [...root.querySelectorAll<HTMLElement>('.slide')];
  const dotsEl = root.querySelector<HTMLElement>('.dots')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('.pause')!;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let userPaused = reduceMotion;

  root.style.setProperty('--slide-ms', `${SLIDE_MS}ms`);

  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot';
    dot.style.setProperty('--ws', slide.style.getPropertyValue('--ws'));
    dot.setAttribute('aria-label', `Slide ${i + 1} of ${slides.length}: ${slide.dataset.label}`);
    dot.innerHTML = `<span class="dot-label">${slide.dataset.label}</span><span class="dot-bar"><span class="dot-fill"></span></span>`;
    dot.addEventListener('click', () => go(i, i < index ? -1 : 1));
    dot.querySelector('.dot-fill')!.addEventListener('animationend', () => go(index + 1, 1));
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
      d.toggleAttribute('aria-current', i === index);
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

  setUserPaused(userPaused);
  show();

  return {
    goTo(id) {
      const i = slides.findIndex((s) => s.dataset.id === id);
      if (i >= 0 && i !== index) go(i, i < index ? -1 : 1);
    },
  };
}
