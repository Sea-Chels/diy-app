
/** Meters to scene units. */
export const K = 0.6;

// Room extents. The back wall's inner face is at z = Z0, the left wall's at x = X0.
export const X0 = -3.5;
export const X1 = 3.5;
export const Z0 = -2.75;
export const Z1 = 2.75;
export const T = 0.14; // exterior wall thickness
export const WH = 2.6; // wall height (the cut)
export const PH = 1.2; // bathroom partitions are cut lower so you can see in
// The bathroom is x in [X0, BX], z in [Z0, BZ]; its partitions sit just outside that.
export const BX = -1.9;
export const BZ = -0.45;
export const PT = 0.12; // partition thickness

/** The finish floor's cut-out at the front, where the planks lift. */
export const HOLE = { x0: 0.2, x1: 1.4, z0: 2.1, z1: 2.55 };
export const WIN = { x0: -0.65, x1: 0.35, y0: 1.1, y1: 2.1 };
export const DOOR = { z0: 1.55, z1: 2.47, y1: 2.1 };
