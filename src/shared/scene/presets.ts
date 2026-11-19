import { LIGHT } from '../theme';
import type { Lighting } from './lights';
import type { StageConfig } from './stage';

type Shared = Pick<StageConfig<never, string, string, never>, 'highlight' | 'near' | 'sky' | 'rims' | 'front' | 'flight' | 'framing' | 'beaconPulse' | 'beaconScale'>;

/** Beacons breathe a little in every workshop but the garage, whose dots sit in the bodywork and pulse harder. */
export const BEACON_PULSE: Shared['beaconPulse'] = { amp: 0.12, speed: 3.2 };

/** Rims behind one model seen up close (the PC, the car), the pink one on `side` (±1 along x). */
export const objectRims = (side: 1 | -1): Lighting['rims'] => ({
  pink: { pos: [6 * side, 3, -4], intensity: 0.9 },
  cyan: { pos: [-6 * side, 2.5, -5], intensity: 0.8 },
});
/** The key light over one model seen up close; add where it sits and how wide its shadows reach. */
export const OBJECT_KEY = { intensity: 1.45, shadowMap: 2048, shadowFar: 25, bias: -0.0005 };

/** A room or yard seen whole: the house and the garden. Add where the key light sits. */
export const SITE = {
  highlight: 'outline',
  near: 0.05,
  sky: { color: LIGHT.skySite, intensity: 0.85 },
  key: { intensity: 1.5, shadowMap: 4096, shadowExtent: 5.4, shadowFar: 30, bias: -0.0004 },
  rims: { pink: { pos: [7, 3, -5], intensity: 0.7 }, cyan: { pos: [-7, 2.5, -6], intensity: 0.6 } },
  front: { pos: [-3, 3, 8], intensity: 0.35 },
  flight: { ms: 1200, lift: 0.8 },
  framing: { desktop: { pullback: 1, shift: 0.2 }, phone: { pullback: 1.3 } },
  beaconPulse: BEACON_PULSE,
  beaconScale: { near: 6, max: 1.3 },
} satisfies Shared & { key: Omit<Lighting['key'], 'pos'> };
