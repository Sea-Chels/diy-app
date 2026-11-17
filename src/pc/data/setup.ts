/** The rig the 3D model shows. Independent from the parts picker, which can push into it. */
export type CaseSize = 'itx' | 'mid' | 'full';
export type Cooling = 'air' | 'aio' | 'loop';
export type GpuSize = 'none' | 'dual' | 'triple';
export type RgbMode = 'off' | 'solid' | 'rainbow';

export interface Setup {
  size: CaseSize;
  cooling: Cooling;
  gpu: GpuSize;
  rgb: RgbMode;
  rgbColor: string;
  caseColor: string;
}

export const DEFAULT_SETUP: Setup = { size: 'mid', cooling: 'air', gpu: 'dual', rgb: 'rainbow', rgbColor: '#6ee7ff', caseColor: '#24232b' };

export const SIZE_LABEL: Record<CaseSize, string> = { itx: 'Mini-ITX', mid: 'Mid tower', full: 'Full tower' };
export const COOLING_LABEL: Record<Cooling, string> = { air: 'Air', aio: 'AIO', loop: 'Custom loop' };
export const GPU_LABEL: Record<GpuSize, string> = { none: 'None', dual: 'Dual fan', triple: 'Triple fan' };
export const RGB_LABEL: Record<RgbMode, string> = { off: 'Off', solid: 'Solid', rainbow: 'Rainbow' };

export const RGB_SWATCHES = ['#6ee7ff', '#ff4fd8', '#9b5cff', '#ff3b3b', '#ffb020', '#4ade80', '#ffffff'];
export const CASE_SWATCHES = [
  { name: 'Black', hex: '#24232b' },
  { name: 'White', hex: '#e9e7ef' },
  { name: 'Graphite', hex: '#5a5f6e' },
  { name: 'Pink', hex: '#f39ac7' },
  { name: 'Mint', hex: '#8fe3c4' },
];

/** A custom loop needs room for a reservoir, so it isn't offered in a Mini-ITX case. */
export function fixSetup(s: Setup): Setup {
  return s.size === 'itx' && s.cooling === 'loop' ? { ...s, cooling: 'aio' } : s;
}
