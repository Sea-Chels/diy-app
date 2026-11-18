import { guideBook, type GuideBase } from '../../shared/guides';
import type { PartId } from './parts';
import type { Cooling } from './setup';
import type { Category } from './catalog';
import { FIRST_BOOT_GUIDES } from './guides/firstBoot';
import { TROUBLESHOOTING_GUIDES } from './guides/troubleshooting';
import { REPLACE_GUIDES } from './guides/replace';

/** fix = something's wrong, swap = install or replace a part, setup = BIOS, OS and first boot. */
export type GuideKind = 'fix' | 'swap' | 'setup';
export const KIND_LABEL: Record<GuideKind, string> = { fix: 'Troubleshoot', swap: 'Replace', setup: 'Set up' };

export interface Guide extends GuideBase<PartId> {
  kind: GuideKind;
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

export const BOOK = guideBook<PartId, Guide>(GUIDES);

export function appliesTo(g: Guide, cooling: Cooling): boolean {
  return !g.cooling || g.cooling.includes(cooling);
}

export function guidesForPart(part: PartId, cooling: Cooling): Guide[] {
  return BOOK.forSpot(part).filter((g) => appliesTo(g, cooling));
}
