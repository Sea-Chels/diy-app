import type { Setup } from '../data/setup';

/** Millimeters to scene units. */
export const K = 0.005;
/** Case panel thickness. */
export const T = 6;
export const FEET = 14;

export interface Dims {
  W: number;
  H: number;
  D: number;
  /** Cable space behind the motherboard tray. */
  gap: number;
  board: { w: number; h: number };
  boardRear: number;
  boardTop: number;
  shroud: number | null;
  front: { n: number; size: number };
  top: { n: number; size: number };
  rear: number | null;
  rad: number;
}

export const DIMS: Record<Setup['size'], Dims> = {
  itx: { W: 185, H: 292, D: 376, gap: 14, board: { w: 170, h: 170 }, boardRear: 8, boardTop: 45, shroud: null, front: { n: 0, size: 120 }, top: { n: 2, size: 120 }, rear: null, rad: 240 },
  mid: { W: 215, H: 465, D: 440, gap: 26, board: { w: 244, h: 305 }, boardRear: 10, boardTop: 50, shroud: 100, front: { n: 3, size: 120 }, top: { n: 2, size: 120 }, rear: 120, rad: 360 },
  full: { W: 240, H: 560, D: 520, gap: 30, board: { w: 244, h: 305 }, boardRear: 15, boardTop: 70, shroud: 125, front: { n: 3, size: 140 }, top: { n: 3, size: 120 }, rear: 140, rad: 360 },
};

/** Motherboard feature positions: u runs from the rear edge toward the front, v down from the top edge. */
export interface Layout {
  socket: [number, number];
  ram: { u0: number; n: number; v0: number; v1: number; fill: number[] };
  pcie: number[];
  m2: [number, number, number];
  cmos: [number, number];
  atx24: [number, number, number];
  eps: [number, number];
  chipset: [number, number, number, number] | null;
  io: [number, number];
  vrmTop: [number, number, number];
  vrmSide: [number, number, number];
  sata: [number, number] | null;
}

export const ATX: Layout = {
  socket: [105, 88],
  ram: { u0: 172, n: 4, v0: 12, v1: 145, fill: [1, 3] },
  pcie: [192, 258],
  m2: [48, 138, 160],
  cmos: [206, 284],
  atx24: [237, 110, 162],
  eps: [34, 9],
  chipset: [172, 226, 200, 250],
  io: [8, 165],
  vrmTop: [45, 145, 17],
  vrmSide: [38, 30, 125],
  sata: [238, 195],
};

export const ITX: Layout = {
  socket: [80, 62],
  ram: { u0: 140, n: 2, v0: 8, v1: 141, fill: [0, 1] },
  pcie: [152],
  m2: [25, 105, 118],
  cmos: [124, 124],
  atx24: [163, 20, 72],
  eps: [30, 7],
  chipset: null,
  io: [8, 140],
  vrmTop: [42, 102, 14],
  vrmSide: [32, 30, 95],
  sata: null,
};
