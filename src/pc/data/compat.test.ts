import { describe, expect, it } from 'vitest';
import { checkBuild, conflictsFor, estimateWatts, resolve, suggestedPsu, type Build } from './compat';
import { PART_BY_ID } from './catalog';

const build = (b: Partial<Build>): Build => ({ storage: [], ...b });
const errors = (b: Build) => checkBuild(b).filter((i) => i.level === 'error');

describe('checkBuild', () => {
  it('flags a CPU that does not fit the socket', () => {
    const [e] = errors(build({ cpu: 'r5-7600', board: 'b550-tomahawk' }));
    expect(e.cats).toEqual(['cpu', 'board']);
    expect(e.text).toMatch(/AM5.*AM4/);
  });
  it('passes a matching CPU and board', () => {
    expect(errors(build({ cpu: 'r5-7600', board: 'b650-tomahawk' }))).toEqual([]);
  });
  it('flags DDR4 on a DDR5 board', () => {
    expect(errors(build({ ram: 'lpx-ddr4-32', board: 'b650-tomahawk' })).map((e) => e.cats)).toEqual([['ram', 'board']]);
  });
  it('needs a graphics card only when the CPU has no graphics', () => {
    expect(errors(build({ cpu: 'r5-5600' })).some((e) => e.cats.includes('gpu'))).toBe(true);
    const missing = checkBuild(build({ cpu: 'r5-7600' })).find((i) => i.text.startsWith('Still to pick'))!;
    expect(missing.cats).not.toContain('gpu');
  });
  it('lists errors before warnings before passes', () => {
    const levels = checkBuild(build({ cpu: 'r5-7600', board: 'b550-tomahawk', ram: 'veng-ddr5-32' })).map((i) => i.level);
    expect(levels).toEqual([...levels].sort((a, b) => ['error', 'warn', 'ok'].indexOf(a) - ['error', 'warn', 'ok'].indexOf(b)));
  });
});

describe('power', () => {
  it('estimates CPU + GPU + 75 W and suggests ~30% headroom in 50 W steps', () => {
    const p = resolve(build({ cpu: 'r5-7600', gpu: 'rtx5060' }));
    const cpu = PART_BY_ID.get('r5-7600') as { watts: number };
    const gpu = PART_BY_ID.get('rtx5060') as { watts: number };
    expect(estimateWatts(p)).toBe(cpu.watts + gpu.watts + 75);
    expect(suggestedPsu(p) % 50).toBe(0);
    expect(suggestedPsu(p)).toBeGreaterThanOrEqual(estimateWatts(p) * 1.3);
    expect(suggestedPsu(p) - 50).toBeLessThan(estimateWatts(p) * 1.3);
  });
});

describe('conflictsFor', () => {
  it('reports only errors the candidate itself causes', () => {
    const base = build({ cpu: 'r5-7600', ram: 'lpx-ddr4-32' });
    const am4 = conflictsFor(base, PART_BY_ID.get('b550-tomahawk')!);
    expect(am4.map((e) => e.cats)).toEqual([['cpu', 'board']]);
    expect(conflictsFor(build({ cpu: 'r5-7600' }), PART_BY_ID.get('b650-tomahawk')!)).toEqual([]);
  });
});
