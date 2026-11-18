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
  card: '#151924',
  sheet: '#141820',
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
} as const;

export type ColorName = keyof typeof PALETTE;

export const WORKSHOP_COLOR = { pc: 'cyan', garage: 'coral', home: 'yellow', garden: 'green', hub: 'pink' } as const satisfies Record<string, ColorName>;

/** The comic lighting every scene shares: warm key, cool front fill, magenta and cyan rims. */
export const LIGHT = { key: 0xfff0dc, front: 0xb8c4ff, rimPink: 0xff4fd8, rimCyan: 0x45e0ff, ground: 0x2a1830 } as const;

export const hex = (name: ColorName): number => parseInt(PALETTE[name].slice(1), 16);

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function paletteCss(): string {
  const vars = Object.entries(PALETTE).map(([k, v]) => `--${kebab(k)}:${v}`);
  for (const [ws, c] of Object.entries(WORKSHOP_COLOR)) vars.push(`--ws-${ws}:var(--${kebab(c)})`);
  vars.push('--burst:linear-gradient(135deg,var(--pink),var(--purple) 55%,var(--sky))');
  return `:root{${vars.join(';')}}`;
}
