import type { Difficulty, GuideBase } from '../../shared/guides';
import type { PartId } from './parts';
import { SERVICE_GUIDES } from './guides/service';
import { LIGHT_GUIDES } from './guides/lights';
import { ELECTRICAL_GUIDES } from './guides/electrical';
import { ENGINE_GUIDES } from './guides/engine';
import { WHEEL_GUIDES } from './guides/wheels';
import { BODY_GUIDES } from './guides/body';
import { UNDER_HOOD_GUIDES } from './guides/underHood';

export type Powertrain = 'gas' | 'diesel' | 'hybrid' | 'ev';
export const POWERTRAIN_LABEL: Record<Powertrain, string> = { gas: 'Gas', diesel: 'Diesel', hybrid: 'Hybrid', ev: 'Electric' };

/** The garage rates jobs by what they take rather than how hard they feel. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'No tools', 2: 'Basic tools', 3: 'Weekend job' };

export interface Guide extends GuideBase {
  /** Hotspots this guide is listed under. First one is the primary. */
  parts: PartId[];
  /** What a shop would charge vs. doing it yourself, as a sentence fragment. */
  savings: string;
  /** Only shown for these powertrains. Omit for all. */
  powertrains?: Powertrain[];
}

export const GUIDES: Guide[] = [
  ...SERVICE_GUIDES,
  ...LIGHT_GUIDES,
  ...ELECTRICAL_GUIDES,
  ...ENGINE_GUIDES,
  ...WHEEL_GUIDES,
  ...BODY_GUIDES,
  ...UNDER_HOOD_GUIDES,
];

export const GUIDE_BY_ID = new Map(GUIDES.map((g) => [g.id, g]));

export function appliesTo(g: Guide, powertrain: Powertrain): boolean {
  return !g.powertrains || g.powertrains.includes(powertrain);
}

export function guidesForPart(part: PartId, powertrain: Powertrain): Guide[] {
  return GUIDES.filter((g) => g.parts.includes(part) && appliesTo(g, powertrain));
}
