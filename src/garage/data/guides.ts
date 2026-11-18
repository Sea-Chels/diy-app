import { guideBook, type Difficulty, type GuideBase } from '../../shared/guides';
import type { PartId } from './parts';
import { SERVICE_GUIDES } from './guides/service';
import { LIGHT_GUIDES } from './guides/lights';
import { ELECTRICAL_GUIDES } from './guides/electrical';
import { ENGINE_GUIDES } from './guides/engine';
import { WHEEL_GUIDES } from './guides/wheels';
import { BODY_GUIDES } from './guides/body';
import { UNDER_HOOD_GUIDES } from './guides/underHood';
import { MOTORCYCLE_GUIDES } from './guides/motorcycle';
import { BICYCLE_GUIDES } from './guides/bicycle';

export type Powertrain = 'gas' | 'diesel' | 'hybrid' | 'ev';
export const POWERTRAIN_LABEL: Record<Powertrain, string> = { gas: 'Gas', diesel: 'Diesel', hybrid: 'Hybrid', ev: 'Electric' };

/** The garage rates jobs by what they take rather than how hard they feel. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'No tools', 2: 'Basic tools', 3: 'Weekend job' };

export interface Guide extends GuideBase<PartId> {
  /** What a shop would charge vs. doing it yourself, as a sentence fragment. */
  savings: string;
  /** Only shown for these car powertrains. Omit for all (and for the motorcycle and bike). */
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
  ...MOTORCYCLE_GUIDES,
  ...BICYCLE_GUIDES,
];

export const BOOK = guideBook<PartId, Guide>(GUIDES);

export function appliesTo(g: Guide, powertrain: Powertrain): boolean {
  return !g.powertrains || g.powertrains.includes(powertrain);
}

export function guidesForPart(part: PartId, powertrain: Powertrain): Guide[] {
  return BOOK.forSpot(part).filter((g) => appliesTo(g, powertrain));
}
