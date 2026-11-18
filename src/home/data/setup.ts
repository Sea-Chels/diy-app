/** How the house model is shown. Every field rebuilds the model. */
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

export function fixSetup(s: Setup): Setup {
  return {
    counter: s.counter in COUNTER_LABEL ? s.counter : DEFAULT_SETUP.counter,
    ceiling: s.ceiling in CEILING_LABEL ? s.ceiling : DEFAULT_SETUP.ceiling,
    floor: s.floor in FLOOR_LABEL ? s.floor : DEFAULT_SETUP.floor,
    wall: s.wall in WALL_LABEL ? s.wall : DEFAULT_SETUP.wall,
  };
}
