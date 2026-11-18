import { expect } from 'vitest';
import type { GuideBase } from '../shared/guides';

/** Checks every workshop's guide book shares: unique ids, real spots, filled-in steps, https links and savings phrasing. */
export function checkGuides<S extends string>(guides: GuideBase<S>[], isSpot: (id: string) => boolean): void {
  const ids = guides.map((g) => g.id);
  expect(ids.filter((id, i) => ids.indexOf(id) !== i), 'duplicate guide ids').toEqual([]);
  for (const g of guides) {
    expect(g.id, 'guide ids are kebab-case, so they work as URL hashes').toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(g.spots.filter((s) => !isSpot(s)), `${g.id}: unknown spots`).toEqual([]);
    expect(new Set(g.spots).size, `${g.id}: a spot listed twice`).toBe(g.spots.length);
    expect(g.steps.length, `${g.id}: no steps`).toBeGreaterThan(0);
    expect(g.minutes[0], `${g.id}: minutes run low to high`).toBeLessThanOrEqual(g.minutes[1]);
    expect(g.query.trim(), `${g.id}: empty video search`).not.toBe('');
    for (const l of g.links ?? []) expect(l.url, `${g.id}: links are https`).toMatch(/^https:\/\//);
    // The guide card capitalizes savings itself and shows it without a full stop.
    if (g.savings) expect(g.savings, `${g.id}: savings is a lowercase fragment`).toMatch(/^[a-z$0-9].*[^.]$/);
  }
}

/** Spot ids used as URL hashes must not collide with guide ids, or a deep link would be ambiguous. */
export function checkHashes(guideIds: string[], spotIds: string[]): void {
  expect(spotIds.filter((s) => guideIds.includes(s))).toEqual([]);
}

/** Every `related` entry names another real spot. */
export function checkRelated<S extends string>(spots: Record<S, { related?: readonly S[] }>): void {
  for (const [id, info] of Object.entries(spots) as [S, { related?: readonly S[] }][]) {
    for (const r of info.related ?? []) {
      expect(Object.hasOwn(spots, r), `${id}: related spot ${r} doesn't exist`).toBe(true);
      expect(r, `${id} lists itself as related`).not.toBe(id);
    }
  }
}
