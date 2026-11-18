/** How the garden model is shown. Every field rebuilds the model. */
import { asRecord, oneOf } from '../../shared/store';
export type Season = 'spring' | 'summer' | 'fall';
export type BedFill = 'hugel' | 'lasagna' | 'mix';
export type HydroKind = 'tower' | 'nft' | 'dwc';

export interface Setup {
  season: Season;
  fill: BedFill;
  hydro: HydroKind;
}

export const DEFAULT_SETUP: Setup = { season: 'summer', fill: 'hugel', hydro: 'tower' };

export const SEASON_LABEL: Record<Season, string> = { spring: 'Spring', summer: 'Summer', fall: 'Fall' };
export const FILL_LABEL: Record<BedFill, string> = { hugel: 'Hugelkultur', lasagna: 'Lasagna', mix: 'Soil mix' };
export const HYDRO_LABEL: Record<HydroKind, string> = { tower: 'PVC tower', nft: 'NFT rack', dwc: 'Deep water' };

export function fixSetup(raw: unknown): Setup {
  const s = asRecord(raw);
  return {
    season: oneOf(s.season, SEASON_LABEL, DEFAULT_SETUP.season),
    fill: oneOf(s.fill, FILL_LABEL, DEFAULT_SETUP.fill),
    hydro: oneOf(s.hydro, HYDRO_LABEL, DEFAULT_SETUP.hydro),
  };
}
