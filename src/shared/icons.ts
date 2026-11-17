/**
 * Lucide icons (https://lucide.dev), imported individually so only the used
 * ones end up in the bundle.
 */
import {
  createElement, ArrowLeft, ArrowRight, BookOpen, Car, Check, CircleAlert, CircleCheck, CircleX, Copy, Cpu, Droplet, ExternalLink,
  Fan, Flower2, Hammer, House, ListChecks, Menu, MousePointerClick, Pause, PiggyBank, Play, PlugZap, Power, Scissors, Shovel,
  SlidersHorizontal, Sprout, Trash2, TriangleAlert, Wrench, X, Zap, type IconNode,
} from 'lucide';

const ICONS = {
  back: ArrowLeft,
  next: ArrowRight,
  book: BookOpen,
  car: Car,
  check: Check,
  alert: CircleAlert,
  ok: CircleCheck,
  bad: CircleX,
  copy: Copy,
  cpu: Cpu,
  droplet: Droplet,
  external: ExternalLink,
  fan: Fan,
  flower: Flower2,
  hammer: Hammer,
  house: House,
  list: ListChecks,
  menu: Menu,
  click: MousePointerClick,
  pause: Pause,
  savings: PiggyBank,
  play: Play,
  plug: PlugZap,
  power: Power,
  scissors: Scissors,
  shovel: Shovel,
  sliders: SlidersHorizontal,
  sprout: Sprout,
  trash: Trash2,
  warning: TriangleAlert,
  wrench: Wrench,
  close: X,
  zap: Zap,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName, size = 18): SVGElement {
  const el = createElement(ICONS[name]);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('aria-hidden', 'true');
  el.classList.add('icon');
  return el;
}

/** Fill every `<i data-icon="name">` placeholder in static HTML. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('i[data-icon]').forEach((el) => {
    const name = el.dataset.icon as IconName;
    if (!(name in ICONS)) return;
    el.replaceWith(icon(name, Number(el.dataset.size) || 18));
  });
}
