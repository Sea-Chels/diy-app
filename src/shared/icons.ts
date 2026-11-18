/**
 * Lucide icons (https://lucide.dev), imported individually so only the used
 * ones end up in the bundle.
 */
import {
  createElement, ArrowLeft, ArrowRight, Bath, BookOpen, Calculator, Car, Check, CircleAlert, CircleCheck, CircleX, Copy, Cpu, DoorOpen, Droplet, ExternalLink,
  Fan, Flower2, Hammer, House, Lightbulb, ListChecks, Menu, Minus, MousePointerClick, PaintRoller, Pause, PiggyBank, Play, PlugZap, Plus, Power, Scissors, Shovel,
  SlidersHorizontal, Sprout, Square, SquareCheck, Sun, Toolbox, Trash2, TriangleAlert, Wrench, X, Zap, type IconNode,
} from 'lucide';

const ICONS = {
  back: ArrowLeft,
  next: ArrowRight,
  bath: Bath,
  book: BookOpen,
  calc: Calculator,
  car: Car,
  check: Check,
  alert: CircleAlert,
  ok: CircleCheck,
  bad: CircleX,
  copy: Copy,
  cpu: Cpu,
  door: DoorOpen,
  droplet: Droplet,
  external: ExternalLink,
  fan: Fan,
  flower: Flower2,
  hammer: Hammer,
  house: House,
  bulb: Lightbulb,
  list: ListChecks,
  menu: Menu,
  minus: Minus,
  click: MousePointerClick,
  paint: PaintRoller,
  pause: Pause,
  savings: PiggyBank,
  play: Play,
  plus: Plus,
  plug: PlugZap,
  power: Power,
  scissors: Scissors,
  shovel: Shovel,
  sliders: SlidersHorizontal,
  sprout: Sprout,
  box: Square,
  boxChecked: SquareCheck,
  sun: Sun,
  toolbox: Toolbox,
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
