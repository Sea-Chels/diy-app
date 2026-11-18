import { describe, expect, it } from 'vitest';
import { checkGuides, checkHashes, checkRelated } from '../../test/guideChecks';
import { GUIDES, POWERTRAIN_LABEL } from './guides';
import { LIDS, PARTS, PART_ORDER, rideOf } from './parts';

describe('garage data', () => {
  it('guides are well formed', () => checkGuides(GUIDES, (id) => Object.hasOwn(PARTS, id)));
  it('part ids and guide ids never collide', () => checkHashes(GUIDES.map((g) => g.id), Object.keys(PARTS)));
  it('related parts exist', () => checkRelated(PARTS));
  it('every guide stays on one vehicle', () => {
    for (const g of GUIDES) expect(new Set(g.spots.map(rideOf)).size, g.id).toBe(1);
  });
  it('only car guides are limited by powertrain', () => {
    for (const g of GUIDES.filter((g) => g.powertrains)) {
      expect(rideOf(g.spots[0]), g.id).toBe('car');
      for (const p of g.powertrains!) expect(Object.hasOwn(POWERTRAIN_LABEL, p)).toBe(true);
    }
  });
  it('every guide says what it saves', () => {
    for (const g of GUIDES) expect(g.savings.trim(), g.id).not.toBe('');
  });
  it('parts sit behind real lids', () => {
    for (const p of Object.values(PARTS)) if (p.behind) expect(LIDS).toContain(p.behind);
  });
  it('the guide index lists every part once', () => {
    expect([...PART_ORDER].sort()).toEqual(Object.keys(PARTS).sort());
  });
});
