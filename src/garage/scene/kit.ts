import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Everything on the car that isn't body paint. */
export const C = {
  tire: 0x23202a,
  rim: 0xd4dbe8,
  barrel: 0x4a4e5a,
  chrome: 0xe6ecf5,
  trim: 0x24212c,
  bay: 0x1b1922,
  engine: 0x5c6273,
  cover: 0x2f3240,
  battery: 0x2c2e36,
  airbox: 0x3b404c,
  coolant: 0xe9f1f5,
  coolantCap: 0xff4f9a,
  washer: 0x4aa3df,
  washerCap: 0x2b6cb0,
  fuse: 0x2a2833,
  oil: 0xf5c542,
  caliper: 0xe2364a,
  disc: 0xa1a7b2,
  positive: 0xe2364a,
  lampBezel: 0x14121a,
  lamp: 0xffe7a8,
  lampGlow: 0xffd77a,
  lampEye: 0xffffff,
  taillight: 0xff3049,
  seat: 0x3d3a48,
  plate: 0xa8d4ff,
};

export const rbox = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
