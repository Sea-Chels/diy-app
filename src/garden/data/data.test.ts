import { describe, expect, it } from 'vitest';
import { checkGuides, checkHashes, checkRelated } from '../../test/guideChecks';
import { GUIDES } from './guides';
import { AREAS, AREA_ORDER, LIDS } from './areas';
import { EXTRA_NAMES, PLANTS, PLANT_BY_ID } from './plants';

describe('garden data', () => {
  it('guides are well formed', () => checkGuides(GUIDES, (id) => Object.hasOwn(AREAS, id)));
  it('area ids and guide ids never collide', () => checkHashes(GUIDES.map((g) => g.id), Object.keys(AREAS)));
  it('related areas exist', () => checkRelated(AREAS));
  it('areas only open real lids', () => {
    for (const a of Object.values(AREAS)) for (const l of a.opens ?? []) expect(LIDS).toContain(l);
  });
  it('guides only name real plants', () => {
    for (const g of GUIDES) expect((g.plants ?? []).filter((p) => !PLANT_BY_ID.has(p)), g.id).toEqual([]);
  });
  it('plant ids are unique and their areas exist', () => {
    expect(PLANT_BY_ID.size).toBe(PLANTS.length);
    for (const p of PLANTS) if (p.area) expect(Object.hasOwn(AREAS, p.area), p.id).toBe(true);
  });
  it('companions name plants the guide knows', () => {
    for (const p of PLANTS) {
      for (const id of [...p.friends, ...p.avoid]) expect(PLANT_BY_ID.has(id) || Object.hasOwn(EXTRA_NAMES, id), `${p.id} -> ${id}`).toBe(true);
    }
  });
  it('no pair is both friends and enemies', () => {
    const clash: string[] = [];
    for (const a of PLANTS) {
      for (const b of a.friends) {
        const other = PLANT_BY_ID.get(b);
        if (a.avoid.includes(b) || other?.avoid.includes(a.id)) clash.push(`${a.id} / ${b}`);
      }
    }
    expect(clash).toEqual([]);
  });
  it('the guide index lists every area once', () => {
    expect([...AREA_ORDER].sort()).toEqual(Object.keys(AREAS).sort());
  });
});
