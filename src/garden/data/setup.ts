/** How the garden model is shown. Every field rebuilds the model. */
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

export function fixSetup(s: Setup): Setup {
  return {
    season: s.season in SEASON_LABEL ? s.season : DEFAULT_SETUP.season,
    fill: s.fill in FILL_LABEL ? s.fill : DEFAULT_SETUP.fill,
    hydro: s.hydro in HYDRO_LABEL ? s.hydro : DEFAULT_SETUP.hydro,
  };
}
