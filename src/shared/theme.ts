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

export const hex = (name: ColorName): number => parseInt(PALETTE[name].slice(1), 16);

/** The comic lighting every scene shares: warm key, cool front fill, magenta and cyan rims, and a sky a shade paler over a whole room or yard than over one model. */
export const LIGHT = { key: 0xfff0dc, front: 0xb8c4ff, rimPink: hex('pink'), rimCyan: hex('rim'), ground: 0x2a1830, skyObject: 0xc9d2ff, skySite: 0xd9e2ff } as const;

/** Scene colors more than one workshop paints with, as 0xrrggbb. */
export const TONE = {
  /** The base under a texture, and under instances tinted one by one. */
  white: hex('hi'),
  black: hex('shade'),
  brass: 0xd8b04a,
  /** Fire-extinguisher, shut-off and hot-tap red. */
  safetyRed: 0xd8432f,
  /** The cold tap's blue next to `safetyRed`. */
  coldBlue: 0x3b82f6,
  hose: 0x3f9a4a,
  terracotta: 0xc8643a,
  /** Hand tools: blades, shovels, scrapers. */
  toolSteel: 0x9aa3b2,
  /** The dark disc the models stand on. */
  ground: 0x1d2133,
  /** Fan hubs and engine covers. */
  cover: 0x2f3240,
  /** Glazed and plastic whites: toilets, PVC, row cover, hydro rafts. */
  porcelain: 0xf6f6f2,
  /** Warm off-white: cut drywall, garden trim. */
  linen: 0xf4efe4,
  /** Near-black parts: cable sleeves, hoses, the engine bay, the PC's black plastic. */
  blackPart: 0x1b1922,
  /** Black switches, trim and drip line. */
  soot: 0x1d1f24,
  /** Dark plastic and painted metal: fan frames, trays, boxes. */
  charcoal: 0x23262e,
  /** Dark gray plastic: GPU shroud, battery, appliance controls. */
  plastic: 0x2b2d36,
  /** Mid-dark gray: RGB parts switched off, fan blades, breaker handles, the airbox. */
  graphite: 0x3a3d48,
  /** Satin gray metal: thermal paste, vents, the breaker panel. */
  alloy: 0x9aa0ab,
  /** Bright bare metal: PC metal, radiators, galvanized steel. */
  silver: 0xb7bdcc,
  /** Brushed steel: fins, appliances, spokes. */
  steel: 0xc4cad6,
  /** Polished metal: CPU lids, chrome fixtures, wheel rims. */
  polished: 0xd4dbe8,
  gunmetal: 0x7d8590,
  /** Near-black brown: the hole in the drywall, a bee. */
  umber: 0x1a1411,
  bark: 0x6b4a30,
  leaf: 0x3f7a34,
  tan: 0xc69c64,
  signalOrange: 0xf08a24,
  coolWhite: 0xf4f0ff,
  brightRed: 0xe2364a,
  glassTint: 0x29285c,
  glassStreak: 0xc3b8ff,
} as const;

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
