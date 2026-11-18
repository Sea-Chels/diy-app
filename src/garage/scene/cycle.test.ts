import { describe, expect, it } from 'vitest';
import { chainPath, type Pulley } from './cycle';

const length = (pts: [number, number, number][]) => pts.reduce((n, p, i) => n + Math.hypot(...p.map((v, k) => v - pts[(i + 1) % pts.length][k])), 0);

describe('chainPath', () => {
  const ring: Pulley = { c: [0, 0], r: 0.1, wrap: 1 };
  const cog: Pulley = { c: [-0.4, 0], r: 0.1, wrap: 1 };

  it('stays in its plane', () => {
    for (const p of chainPath([ring, cog], 0.07)) expect(p[0]).toBe(0.07);
  });
  it('wraps two equal pulleys in 2 × centres + one circumference', () => {
    expect(length(chainPath([ring, cog], 0, 0.002))).toBeCloseTo(2 * 0.4 + 2 * Math.PI * 0.1, 2);
  });
  it('runs round a derailleur’s S-bend', () => {
    const guide: Pulley = { c: [-0.42, -0.1], r: 0.024, wrap: -1 };
    const tension: Pulley = { c: [-0.38, -0.19], r: 0.024, wrap: 1 };
    const pts = chainPath([ring, { ...cog, r: 0.042 }, guide, tension], 0);
    expect(pts.every((p) => p.every(Number.isFinite))).toBe(true);
  });
  it('refuses pulleys that overlap', () => {
    expect(() => chainPath([ring, { c: [0.05, 0], r: 0.1, wrap: -1 }], 0)).toThrow(/overlap/);
  });
});
