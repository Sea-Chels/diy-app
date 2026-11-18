import { describe, expect, it } from 'vitest';
import { checkGuides, checkHashes, checkRelated } from '../../test/guideChecks';
import { GUIDES } from './guides';
import { AREAS, AREA_ORDER, LIDS } from './areas';
import { TOOLS, TOOL_BY_ID } from './tools';

describe('home data', () => {
  it('guides are well formed', () => checkGuides(GUIDES, (id) => Object.hasOwn(AREAS, id)));
  it('area ids and guide ids never collide', () => checkHashes(GUIDES.map((g) => g.id), Object.keys(AREAS)));
  it('related areas exist', () => checkRelated(AREAS));
  it('areas only open real lids', () => {
    for (const a of Object.values(AREAS)) for (const l of a.opens ?? []) expect(LIDS).toContain(l);
  });
  it('tool ids in guides are in the toolbox', () => {
    // Plain-text tools ("Hex (Allen) keys") are allowed; anything shaped like an id must resolve.
    for (const g of GUIDES) expect(g.tools.filter((t) => /^[a-z0-9-]+$/.test(t) && !TOOL_BY_ID.has(t)), g.id).toEqual([]);
  });
  it('tool ids are unique and every tool is used', () => {
    expect(TOOL_BY_ID.size).toBe(TOOLS.length);
    const used = new Set(GUIDES.flatMap((g) => g.tools));
    expect(TOOLS.filter((t) => !used.has(t.id)).map((t) => t.id)).toEqual([]);
  });
  it('the guide index lists every area once', () => {
    expect([...AREA_ORDER].sort()).toEqual(Object.keys(AREAS).sort());
  });
});
