/** How the house model is shown. Every field rebuilds the model. */
import { asRecord, oneOf } from '../../shared/store';
export type Counter = 'laminate' | 'butcher' | 'quartz';
export type Ceiling = 'fan' | 'light';
export type Floor = 'oak' | 'lvp' | 'tile';
export type WallColor = 'cream' | 'sage' | 'blue' | 'clay';

export interface Setup {
  counter: Counter;
  ceiling: Ceiling;
  floor: Floor;
  wall: WallColor;
}

export const DEFAULT_SETUP: Setup = { counter: 'butcher', ceiling: 'fan', floor: 'oak', wall: 'sage' };

export const COUNTER_LABEL: Record<Counter, string> = { laminate: 'Laminate', butcher: 'Butcher block', quartz: 'Quartz' };
export const CEILING_LABEL: Record<Ceiling, string> = { fan: 'Ceiling fan', light: 'Light fixture' };
export const FLOOR_LABEL: Record<Floor, string> = { oak: 'Hardwood', lvp: 'Vinyl plank', tile: 'Tile' };
export const WALL_LABEL: Record<WallColor, string> = { cream: 'Cream', sage: 'Sage', blue: 'Blue', clay: 'Clay' };
export const WALL_HEX: Record<WallColor, number> = { cream: 0xeee3cc, sage: 0xb8c8a8, blue: 0xa9bfd6, clay: 0xd9a98c };

export function fixSetup(raw: unknown): Setup {
  const s = asRecord(raw);
  return {
    counter: oneOf(s.counter, COUNTER_LABEL, DEFAULT_SETUP.counter),
    ceiling: oneOf(s.ceiling, CEILING_LABEL, DEFAULT_SETUP.ceiling),
    floor: oneOf(s.floor, FLOOR_LABEL, DEFAULT_SETUP.floor),
    wall: oneOf(s.wall, WALL_LABEL, DEFAULT_SETUP.wall),
  };
}
