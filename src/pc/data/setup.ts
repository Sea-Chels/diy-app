/** The rig the 3D model shows. Independent from the parts picker, which can push into it. */
import { asRecord, oneOf } from '../../shared/store';
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

export const RGB_SWATCHES = [
  { name: 'Ice blue', hex: '#6ee7ff' },
  { name: 'Hot pink', hex: '#ff4fd8' },
  { name: 'Purple', hex: '#9b5cff' },
  { name: 'Red', hex: '#ff3b3b' },
  { name: 'Amber', hex: '#ffb020' },
  { name: 'Green', hex: '#4ade80' },
  { name: 'White', hex: '#ffffff' },
];
export const CASE_SWATCHES = [
  { name: 'Black', hex: '#24232b' },
  { name: 'White', hex: '#e9e7ef' },
  { name: 'Graphite', hex: '#5a5f6e' },
  { name: 'Pink', hex: '#f39ac7' },
  { name: 'Mint', hex: '#8fe3c4' },
];

const color = (v: unknown, fallback: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);

export function fixSetup(raw: unknown): Setup {
  const s = asRecord(raw);
  const size = oneOf(s.size, SIZE_LABEL, DEFAULT_SETUP.size);
  const cooling = oneOf(s.cooling, COOLING_LABEL, DEFAULT_SETUP.cooling);
  return {
    size,
    // A custom loop needs room for a reservoir, so it isn't offered in a Mini-ITX case.
    cooling: size === 'itx' && cooling === 'loop' ? 'aio' : cooling,
    gpu: oneOf(s.gpu, GPU_LABEL, DEFAULT_SETUP.gpu),
    rgb: oneOf(s.rgb, RGB_LABEL, DEFAULT_SETUP.rgb),
    rgbColor: color(s.rgbColor, DEFAULT_SETUP.rgbColor),
    caseColor: color(s.caseColor, DEFAULT_SETUP.caseColor),
  };
}
