/**
 * The one palette for CSS and 3D. vite.config.ts injects it into every page as
 * `--name` custom properties (so the inline loader can use it before any CSS
 * loads); scene code reads the same values as numbers through `hex`.
 */
export const PALETTE = {
  ink: '#16111f',
  bg: '#0f1218',
  bgGlow: '#1c2230',
  bgDeep: '#0a0c10',
  text: '#eef0f4',
  muted: '#9aa3b2',
  /** Cards, sheets, fields and the glass behind panels. */
  surface: '#151924',
  onAccent: '#06202a',
  cyan: '#6ee7ff',
  pink: '#ff4fd8',
  yellow: '#ffd23f',
  green: '#4ade80',
  coral: '#f2694c',
  peach: '#ff9f7a',
  lilac: '#c9a2ff',
  mint: '#86efac',
  red: '#f87171',
  amber: '#fbbf24',
  butter: '#fde68a',
  violet: '#b46cff',
  purple: '#7b3fe4',
  sky: '#1d9bf0',
  water: '#7fd8ff',
  rose: '#fb7185',
  lime: '#a3e635',
  ochre: '#f59e0b',
  /** The cool rim light's hue, for the glow behind a scene. */
  rim: '#45e0ff',
  hi: '#ffffff',
  shade: '#000000',
  /** The darkest backdrop: modal scrims, hard comic shadows, the vignette. */
  scrim: '#05060a',
  /** The lilac tint behind "call a pro" advice. */
  advise: '#9b5cff',
  /** Light text on green and red tinted chips; the clash note reads stronger. */
  goodText: '#bbf7d0',
  badText: '#fecaca',
  clashText: '#fca5a5',
  /** Pink text where a pink badge tint is too dark to read. */
  pinkText: '#ff9be8',
  soil: '#3a2a1d',
  /** Galvanized steel, as on a raised-bed frame. */
  steel: '#8b9298',
} as const;

export type ColorName = keyof typeof PALETTE;

export const WORKSHOP_COLOR = { pc: 'cyan', garage: 'coral', home: 'yellow', garden: 'green', hub: 'pink' } as const satisfies Record<string, ColorName>;

/** The comic lighting every scene shares: warm key, cool front fill, magenta and cyan rims, and a sky a shade paler over a whole room or yard than over one model. */
export const LIGHT = { key: 0xfff0dc, front: 0xb8c4ff, rimPink: 0xff4fd8, rimCyan: 0x45e0ff, ground: 0x2a1830, skyObject: 0xc9d2ff, skySite: 0xd9e2ff } as const;

export const hex = (name: ColorName): number => parseInt(PALETTE[name].slice(1), 16);

/** A 0xrrggbb number as a CSS color. */
export const cssHex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

const BURST_SHAPE = `polygon(${[[50, 0], [58, 18], [75, 6], [74, 26], [96, 20], [84, 38], [100, 50], [84, 62], [96, 80], [74, 74], [75, 94], [58, 82], [50, 100], [42, 82], [25, 94], [26, 74], [4, 80], [16, 62], [0, 50], [16, 38], [4, 20], [26, 26], [25, 6], [42, 18]].map(([x, y]) => `${x}% ${y}%`).join(',')})`;

/** The custom-color swatch: a full turn of hues. */
const HUE_WHEEL = ['#ff4f6d', '#ffc531', '#9be22d', '#14b8a6', '#2f5bea', PALETTE.purple, '#ff4fa3', '#ff4f6d'];

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Colors CSS uses at several alphas go out as bare channels, as in `rgb(var(--surface) / 0.9)`. */
const CHANNELS: ColorName[] = ['surface', 'hi', 'shade', 'scrim', 'advise'];
const channels = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');

export function paletteCss(): string {
  const vars = Object.entries(PALETTE).map(([k, v]) => `--${kebab(k)}:${CHANNELS.includes(k as ColorName) ? channels(v) : v}`);
  for (const [ws, c] of Object.entries(WORKSHOP_COLOR)) vars.push(`--ws-${ws}:var(--${kebab(c)})`);
  vars.push('--burst:linear-gradient(135deg,var(--pink),var(--purple) 55%,var(--sky))');
  // The comic starburst outline, for clip-path.
  vars.push(`--burst-shape:${BURST_SHAPE}`);
  vars.push(`--hue-wheel:conic-gradient(${HUE_WHEEL.join(',')})`);
  // initial-value can't reference other properties, so the hub's animated --ws gets its default here.
  return `@property --ws{syntax:'<color>';inherits:true;initial-value:${PALETTE.violet}}:root{${vars.join(';')}}`;
}
