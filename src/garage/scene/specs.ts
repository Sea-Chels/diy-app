import type { BodyKind } from '../data/paint';

type Pts = [number, number][];

export interface Spec {
  halfW: number;
  wheelR: number;
  wheelW: number;
  track: number;
  wheelZ: [number, number]; // front, rear
  bottom: number;
  belt: number;
  tailZ: number;
  cowlZ: number;
  fasciaZ: number;
  noseZ: number;
  bayFloor: number;
  lowerTop: Pts;
  lowerBottom: Pts;
  lowerWidth: Pts;
  hood: Pts;
  fasciaTop: Pts;
  fasciaBottom: Pts;
  fasciaWidth: Pts;
  ghRearZ: number;
  roof: Pts;
  ghW: [number, number];
  roofPanel: [number, number];
  aPillar: [number, number];
  cornerPillars: [number, number][];
  vertPillars: number[];
  door: [number, number];
  rearDoor: [number, number];
  doorY: [number, number];
  deck: [number, number] | null; // sedan trunk lid z range
  seatZ: number;
  rearSeatZ: number | null;
  /** Cabin floor height, and the raised cargo floor behind the rear seat (SUV). */
  floorY: number;
  cargoFloorY: number | null;
  suv: boolean;
}

export const SPECS: Record<BodyKind, Spec> = {
  sedan: {
    halfW: 0.9,
    wheelR: 0.34,
    wheelW: 0.24,
    track: 0.77,
    wheelZ: [1.4, -1.38],
    bottom: 0.26,
    belt: 0.97,
    tailZ: -2.28,
    cowlZ: 0.74,
    fasciaZ: 1.95,
    noseZ: 2.42,
    bayFloor: 0.5,
    lowerTop: [[-2.28, 0.8], [-2.2, 0.92], [-2.0, 0.96], [-1.2, 0.97], [0.74, 0.97]],
    lowerBottom: [[-2.28, 0.46], [-2.17, 0.3], [-1.95, 0.26], [0.74, 0.26]],
    lowerWidth: [[-2.28, 0.83], [-2.12, 0.89], [-1.8, 0.9], [0.74, 0.9]],
    hood: [[0.7, 0.97], [1.3, 0.93], [1.9, 0.88], [2.08, 0.86]],
    fasciaTop: [[1.95, 0.875], [2.12, 0.83], [2.26, 0.74], [2.35, 0.62], [2.4, 0.5], [2.42, 0.42]],
    fasciaBottom: [[1.95, 0.26], [2.2, 0.27], [2.32, 0.29], [2.39, 0.33], [2.42, 0.38]],
    fasciaWidth: [[1.95, 0.9], [2.15, 0.89], [2.3, 0.83], [2.38, 0.74], [2.42, 0.62]],
    ghRearZ: -1.6,
    roof: [[0.76, 0.97], [0.35, 1.21], [0.0, 1.36], [-0.4, 1.4], [-0.8, 1.34], [-1.2, 1.19], [-1.6, 0.99]],
    ghW: [0.82, 0.63],
    roofPanel: [-0.8, 0.0],
    aPillar: [-0.05, 0.74],
    cornerPillars: [[-1.6, -0.8]],
    vertPillars: [-0.34],
    door: [-0.32, 0.7],
    rearDoor: [-0.98, -0.37],
    doorY: [0.34, 0.92],
    deck: [-2.16, -1.62],
    seatZ: -0.05,
    rearSeatZ: -0.62,
    floorY: 0.57,
    cargoFloorY: null,
    suv: false,
  },
  suv: {
    halfW: 0.95,
    wheelR: 0.41,
    wheelW: 0.28,
    track: 0.8,
    wheelZ: [1.45, -1.45],
    bottom: 0.4,
    belt: 1.13,
    tailZ: -2.32,
    cowlZ: 0.78,
    fasciaZ: 2.0,
    noseZ: 2.43,
    bayFloor: 0.66,
    lowerTop: [[-2.32, 1.12], [-2.28, 1.13], [-2.1, 1.13], [0.78, 1.13]],
    lowerBottom: [[-2.32, 0.6], [-2.2, 0.44], [-2.0, 0.4], [0.78, 0.4]],
    lowerWidth: [[-2.32, 0.93], [-2.26, 0.95], [-1.9, 0.95], [0.78, 0.95]],
    hood: [[0.74, 1.13], [1.4, 1.1], [2.0, 1.06], [2.12, 1.04]],
    fasciaTop: [[2.0, 1.06], [2.15, 1.03], [2.28, 0.95], [2.36, 0.84], [2.41, 0.71], [2.43, 0.6]],
    fasciaBottom: [[2.0, 0.4], [2.25, 0.41], [2.36, 0.43], [2.41, 0.47], [2.43, 0.52]],
    fasciaWidth: [[2.0, 0.95], [2.18, 0.94], [2.32, 0.88], [2.4, 0.79], [2.43, 0.66]],
    ghRearZ: -2.04,
    roof: [[0.8, 1.13], [0.35, 1.48], [0.0, 1.7], [-0.8, 1.75], [-1.8, 1.74], [-2.1, 1.7], [-2.2, 1.67]],
    ghW: [0.86, 0.7],
    roofPanel: [-2.0, 0.06],
    aPillar: [0.02, 0.78],
    cornerPillars: [],
    vertPillars: [-0.37, -1.52],
    door: [-0.35, 0.74],
    rearDoor: [-1.0, -0.4],
    doorY: [0.55, 1.08],
    deck: null,
    seatZ: -0.05,
    rearSeatZ: -0.95,
    floorY: 0.71,
    cargoFloorY: 0.93,
    suv: true,
  },
};
