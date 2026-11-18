import { guideBook, type GuideBase } from '../../shared/guides';
import type { AreaId } from './areas';
import { SINK_GUIDES } from './guides/sink';
import { COUNTERS_GUIDES } from './guides/counters';
import { APPLIANCES_GUIDES } from './guides/appliances';
import { TOILET_GUIDES } from './guides/toilet';
import { BATH_GUIDES } from './guides/bath';
import { WINDOW_GUIDES } from './guides/window';
import { DOOR_GUIDES } from './guides/door';
import { OUTLETS_GUIDES } from './guides/outlets';
import { LIGHTS_GUIDES } from './guides/lights';
import { SAFETY_GUIDES } from './guides/safety';
import { DRYWALL_GUIDES } from './guides/drywall';
import { REFINISHING_GUIDES } from './guides/refinishing';
import { FLOORS_GUIDES } from './guides/floors';
import { GUTTERS_GUIDES } from './guides/gutters';
import { OUTSIDE_GUIDES } from './guides/outside';

/** fix = something's wrong, install = replace or add a thing, finish = patch, paint and refinish, maintain = keep it working. */
export type GuideKind = 'fix' | 'install' | 'finish' | 'maintain';
export const KIND_LABEL: Record<GuideKind, string> = { fix: 'Troubleshoot', install: 'Install & replace', finish: 'Patch & finish', maintain: 'Maintain' };

export interface Guide extends GuideBase<AreaId> {
  kind: GuideKind;
  /** When it stops being a DIY job. */
  pro?: string;
}

export const GUIDES: Guide[] = [
  ...SINK_GUIDES,
  ...COUNTERS_GUIDES,
  ...APPLIANCES_GUIDES,
  ...TOILET_GUIDES,
  ...BATH_GUIDES,
  ...WINDOW_GUIDES,
  ...DOOR_GUIDES,
  ...OUTLETS_GUIDES,
  ...LIGHTS_GUIDES,
  ...SAFETY_GUIDES,
  ...DRYWALL_GUIDES,
  ...REFINISHING_GUIDES,
  ...FLOORS_GUIDES,
  ...GUTTERS_GUIDES,
  ...OUTSIDE_GUIDES,
];

export const BOOK = guideBook<AreaId, Guide>(GUIDES);
