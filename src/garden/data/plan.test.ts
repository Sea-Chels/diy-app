import { describe, expect, it } from 'vitest';
import { checkPlan, planRows } from './plan';
import { PLANTS, relation, squares, type Plant } from './plants';
import { must } from '../../shared/must';

const plant = (spacing: number): Plant => ({ ...PLANTS[0], spacing });

describe('squares', () => {
  it('follows square-foot spacing', () => {
    expect(squares(plant(3))).toEqual({ perSquare: 16, squares: 1 });
    expect(squares(plant(4))).toEqual({ perSquare: 9, squares: 1 });
    expect(squares(plant(6))).toEqual({ perSquare: 4, squares: 1 });
    expect(squares(plant(12))).toEqual({ perSquare: 1, squares: 1 });
    expect(squares(plant(24))).toEqual({ perSquare: 1, squares: 4 });
  });
});

describe('planRows', () => {
  it('counts repeats and drops unknown ids', () => {
    const id = PLANTS[0].id;
    const [row, ...rest] = planRows([id, id, 'not-a-plant']);
    expect(rest).toEqual([]);
    expect(row.count).toBe(2);
    expect(row.squares).toBe(2 * squares(row.plant).squares);
  });
});

describe('checkPlan', () => {
  it('errors when the plan needs more squares than the bed has', () => {
    const big = must(PLANTS.find((p) => squares(p).squares > 1), 'a plant over one square');
    const rows = planRows(Array(17).fill(big.id));
    expect(checkPlan(rows, 16).issues.some((i) => i.level === 'error')).toBe(true);
  });
  it('splits pairs into companions and clashes', () => {
    const a = must(PLANTS.find((p) => p.avoid.some((id) => PLANTS.some((q) => q.id === id))), 'a plant with a foe');
    const b = must(a.avoid.find((id) => PLANTS.some((q) => q.id === id)), 'its foe');
    const { bad, good } = checkPlan(planRows([a.id, b]), 32);
    expect(bad.map(([x, y]) => [x.id, y.id])).toEqual([[a.id, b]]);
    expect(good).toEqual([]);
  });
});

describe('relation', () => {
  it('is symmetric', () => {
    for (const a of PLANTS) for (const b of PLANTS) expect(relation(a.id, b.id), `${a.id}/${b.id}`).toBe(relation(b.id, a.id));
  });
});
