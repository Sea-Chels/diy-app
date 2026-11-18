import type { GuideBase } from '../../shared/guides';
import type { PartId } from './parts';
import type { Cooling } from './setup';
import type { Category } from './catalog';
import { FIRST_BOOT_GUIDES } from './guides/firstBoot';
import { TROUBLESHOOTING_GUIDES } from './guides/troubleshooting';
import { REPLACE_GUIDES } from './guides/replace';

/** fix = something's wrong, swap = install or replace a part, setup = BIOS, OS and first boot. */
export type GuideKind = 'fix' | 'swap' | 'setup';
export const KIND_LABEL: Record<GuideKind, string> = { fix: 'Troubleshoot', swap: 'Replace', setup: 'Set up' };

export interface Guide extends GuideBase {
  kind: GuideKind;
  /** Hotspots this guide is listed under. First one is the primary. */
  parts: PartId[];
  /** Only shown for these cooling setups. Omit for all. */
  cooling?: Cooling[];
  /** When the parts picker has a part in this category, its name leads the video search. */
  ctx?: Category;
}

export const GUIDES: Guide[] = [
  ...FIRST_BOOT_GUIDES,
  ...TROUBLESHOOTING_GUIDES,
  ...REPLACE_GUIDES,
];

export const GUIDE_BY_ID = new Map(GUIDES.map((g) => [g.id, g]));

export function appliesTo(g: Guide, cooling: Cooling): boolean {
  return !g.cooling || g.cooling.includes(cooling);
}

export function guidesForPart(part: PartId, cooling: Cooling): Guide[] {
  return GUIDES.filter((g) => g.parts.includes(part) && appliesTo(g, cooling));
}
