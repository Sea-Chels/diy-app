import { describe, expect, it } from 'vitest';
import { checkGuides, checkHashes, checkRelated } from '../../test/guideChecks';
import { GUIDES } from './guides';
import { LIDS, PARTS } from './parts';
import { CATALOG, CATEGORIES } from './catalog';
import { PART_CATEGORY } from '../ui/context';

describe('pc data', () => {
  it('guides are well formed', () => checkGuides(GUIDES, (id) => Object.hasOwn(PARTS, id)));
  it('part ids and guide ids never collide', () => checkHashes(GUIDES.map((g) => g.id), Object.keys(PARTS)));
  it('related parts exist', () => checkRelated(PARTS));
  it('parts only open real lids', () => {
    for (const p of Object.values(PARTS)) for (const l of p.opens ?? []) expect(LIDS).toContain(l);
  });
  it('every part has a guide', () => {
    for (const id of Object.keys(PARTS)) expect(GUIDES.some((g) => g.spots.includes(id as never)), id).toBe(true);
  });
  it('catalog ids are unique and every category has parts', () => {
    const ids = CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CATEGORIES) expect(CATALOG.some((p) => p.cat === c), c).toBe(true);
  });
  it('picker shortcuts point at real categories', () => {
    for (const c of Object.values(PART_CATEGORY)) expect(CATEGORIES).toContain(c);
  });
});
