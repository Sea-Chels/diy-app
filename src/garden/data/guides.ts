import type { GuideBase } from '../../shared/guides';
import type { AreaId } from './areas';
import { RAISED_BEDS_GUIDES } from './guides/raisedBeds';
import { KITCHEN_BED_GUIDES } from './guides/kitchenBed';
import { THREE_SISTERS_GUIDES } from './guides/threeSisters';
import { TUNNEL_GUIDES } from './guides/tunnel';
import { SEEDLINGS_GUIDES } from './guides/seedlings';
import { COMPOST_GUIDES } from './guides/compost';
import { WATER_GUIDES } from './guides/water';
import { HYDROPONICS_GUIDES } from './guides/hydroponics';
import { HERBS_GUIDES } from './guides/herbs';
import { FRUIT_GUIDES } from './guides/fruit';
import { POLLINATORS_GUIDES } from './guides/pollinators';
import { ARBOR_GUIDES } from './guides/arbor';
import { PANTRY_GUIDES } from './guides/pantry';
import { TOOLS_GUIDES } from './guides/tools';

/** build = make a thing, grow = planting and care, fix = something's wrong, preserve = keep the harvest. */
export type GuideKind = 'build' | 'grow' | 'fix' | 'preserve';
export const KIND_LABEL: Record<GuideKind, string> = { build: 'Build', grow: 'Grow', fix: 'Troubleshoot', preserve: 'Preserve' };

export interface Guide extends GuideBase<GuideKind> {
  /** Areas this guide is listed under. First one is the primary. */
  areas: AreaId[];
  /** Waiting time on top of the hands-on work, if any. */
  wait?: string;
  /** Plant cards this guide relates to. */
  plants?: string[];
}

export const GUIDES: Guide[] = [
  ...RAISED_BEDS_GUIDES,
  ...KITCHEN_BED_GUIDES,
  ...THREE_SISTERS_GUIDES,
  ...TUNNEL_GUIDES,
  ...SEEDLINGS_GUIDES,
  ...COMPOST_GUIDES,
  ...WATER_GUIDES,
  ...HYDROPONICS_GUIDES,
  ...HERBS_GUIDES,
  ...FRUIT_GUIDES,
  ...POLLINATORS_GUIDES,
  ...ARBOR_GUIDES,
  ...PANTRY_GUIDES,
  ...TOOLS_GUIDES,
];

export const GUIDE_BY_ID = new Map(GUIDES.map((g) => [g.id, g]));

export function guidesForArea(area: AreaId): Guide[] {
  return GUIDES.filter((g) => g.areas.includes(area));
}

export function guidesForPlant(id: string): Guide[] {
  return GUIDES.filter((g) => g.plants?.includes(id));
}
