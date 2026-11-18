/**
 * Plant care cards: common vegetables through to pawpaws, goji and
 * marshmallow root. Companion pairs follow traditional garden lore plus
 * extension-service advice; they're starting points, not laws. Spacing is in
 * inches (square-foot planting uses it), zones are USDA hardiness zones and
 * only matter for perennials.
 */
import type { AreaId } from './areas';
import { FRUITING_PLANTS } from './plants/fruiting';
import { LEGUMES_PLANTS } from './plants/legumes';
import { ROOTS_PLANTS } from './plants/roots';
import { GREENS_PLANTS } from './plants/greens';
import { FRUIT_PLANTS } from './plants/fruit';
import { HERBS_PLANTS } from './plants/herbs';
import { FLOWERS_PLANTS } from './plants/flowers';

export type PlantType = 'veg' | 'fruit' | 'herb' | 'flower';
export type Sun = 'full' | 'part' | 'shade';
export type Water = 'low' | 'medium' | 'high';
export type Life = 'annual' | 'biennial' | 'perennial' | 'shrub' | 'tree' | 'vine';

export interface Plant {
  id: string;
  name: string;
  latin: string;
  type: PlantType;
  life: Life;
  sun: Sun;
  water: Water;
  /** Hardiness for perennials, shrubs and trees. */
  zones?: [number, number];
  /** Inches between plants. */
  spacing: number;
  /** Mature height, as text. */
  height: string;
  /** When and how to plant. */
  sow: string;
  /** Rough time to first harvest. */
  days: string;
  care: string[];
  harvest: string;
  problems: string[];
  friends: string[];
  avoid: string[];
  /** Soil pH preference when it's unusual. */
  ph?: string;
  /** Somewhere in the 3D garden this plant grows. */
  area?: AreaId;
  /** Unusual or exotic: gets a badge in the plant guide. */
  unusual?: boolean;
  note?: string;
}

export const TYPE_LABEL: Record<PlantType, string> = { veg: 'Vegetables', fruit: 'Fruit & berries', herb: 'Herbs', flower: 'Flowers' };
export const SUN_LABEL: Record<Sun, string> = { full: 'Full sun', part: 'Part sun', shade: 'Shade' };
export const WATER_LABEL: Record<Water, string> = { low: 'Low water', medium: 'Medium water', high: 'Thirsty' };
export const LIFE_LABEL: Record<Life, string> = { annual: 'Annual', biennial: 'Biennial', perennial: 'Perennial', shrub: 'Shrub', tree: 'Tree', vine: 'Perennial vine' };

export const PLANTS: Plant[] = [
  ...FRUITING_PLANTS,
  ...LEGUMES_PLANTS,
  ...ROOTS_PLANTS,
  ...GREENS_PLANTS,
  ...FRUIT_PLANTS,
  ...HERBS_PLANTS,
  ...FLOWERS_PLANTS,
];

/** Plants that turn up in companion lore but don't have their own card. */
/** Companions that aren't in the plant guide themselves. */
export const EXTRA_NAMES: Record<string, string> = { walnut: 'black walnut', hyssop: 'hyssop', clover: 'clover', tansy: 'tansy', horseradish: 'horseradish', rue: 'rue' };

export const PLANT_BY_ID = new Map(PLANTS.map((p) => [p.id, p]));
export const plantName = (id: string) => PLANT_BY_ID.get(id)?.name ?? EXTRA_NAMES[id] ?? id;

/** Friendship works both ways: if either lists the other, they're companions. */
export function relation(a: string, b: string): 'friend' | 'avoid' | null {
  const pa = PLANT_BY_ID.get(a);
  const pb = PLANT_BY_ID.get(b);
  if (pa?.avoid.includes(b) || pb?.avoid.includes(a)) return 'avoid';
  if (pa?.friends.includes(b) || pb?.friends.includes(a)) return 'friend';
  return null;
}

/** Square-foot gardening: plants per square for small things, squares per plant for big ones. */
export function squares(p: Plant): { perSquare: number; squares: number } {
  if (p.spacing <= 3) return { perSquare: 16, squares: 1 };
  if (p.spacing <= 4) return { perSquare: 9, squares: 1 };
  if (p.spacing <= 6) return { perSquare: 4, squares: 1 };
  if (p.spacing <= 12) return { perSquare: 1, squares: 1 };
  return { perSquare: 1, squares: Math.ceil((p.spacing / 12) ** 2) };
}
