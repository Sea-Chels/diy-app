import { describe, expect, it, vi } from 'vitest';
import { frameView, type Clearance, type Framing, type Insets } from './framing';
import type { View } from './stage';

const FOV = 36;
const TAN = Math.tan((FOV / 2) * (Math.PI / 180));
const FRAMING: Framing = { desktop: { pullback: 1.3, shift: 0.2 }, phone: { pullback: 1.5 } };
const SIDE: View = { pos: [0, 0, 10], target: [0, 0, 0] };
const DOWN: View = { pos: [0, 10, 0], target: [0, 0, 0] };
/** The panel covers the bottom half of a 800 px tall canvas. */
const HALF: Insets = { height: 800, top: 0, bottom: 400 };
const NONE: Insets = { height: 800, top: 0, bottom: 0 };
const blocked: Clearance = () => 0;
const open: Clearance = () => Infinity;
const phone = (v: View, insets: Insets, clear: Clearance = blocked) => frameView(v, FOV, true, insets, FRAMING, clear);
const dist = (v: View) => Math.hypot(...v.pos.map((p, i) => p - v.target[i]));

describe('frameView on a phone', () => {
  it('slides the view down by the covered half-heights, keeping its direction', () => {
    const v = phone(SIDE, HALF);
    expect(v.target[1]).toBeCloseTo(-TAN * 0.5 * 10);
    expect(v.pos[1]).toBeCloseTo(v.target[1]);
    expect(v.pos[2] - v.target[2]).toBeCloseTo(10);
  });

  it('slides up instead when the top controls cover more than the panel', () => {
    expect(phone(SIDE, { height: 800, top: 300, bottom: 100 }).target[1]).toBeGreaterThan(0);
  });

  it('pulls back the full amount when nothing is in the way', () => {
    expect(dist(phone(SIDE, NONE, open))).toBeCloseTo(10 * FRAMING.phone.pullback);
  });

  it('stops the pullback short of whatever is behind the camera', () => {
    const clear = vi.fn<Clearance>(() => 2);
    expect(dist(phone(SIDE, NONE, clear))).toBeCloseTo(10 + 2 - 0.15);
    const [from, dir, far] = clear.mock.calls[0];
    expect(from.toArray()).toEqual([0, 0, 10]);
    expect(dir.toArray()).toEqual([0, 0, 1]);
    expect(far).toBeCloseTo(10 * (FRAMING.phone.pullback - 1));
  });

  it('never moves closer than authored when the camera is boxed in', () => {
    expect(dist(phone(SIDE, NONE, blocked))).toBeCloseTo(10);
  });

  it('leaves the view alone while the canvas has no height', () => {
    const v = phone(SIDE, { height: 0, top: 50, bottom: 400 });
    expect(v.pos).toEqual(SIDE.pos);
    expect(v.target).toEqual(SIDE.target);
  });

  it('slides a straight-down view toward +z, the way three turns its screen-up', () => {
    const v = phone(DOWN, HALF);
    expect(v.target[0]).toBeCloseTo(0);
    expect(v.target[2]).toBeCloseTo(TAN * 0.5 * 10);
    expect([...v.pos, ...v.target].every(Number.isFinite)).toBe(true);
  });
});

describe('frameView on desktop', () => {
  it('pulls back, then shifts the view to its right so the target sits left of the panel', () => {
    const v = frameView(SIDE, FOV, false, HALF, FRAMING, open);
    expect(v.target[0]).toBeCloseTo(10 * 1.3 * 0.2);
    expect(v.pos[0]).toBeCloseTo(v.target[0]);
    expect(dist(v)).toBeCloseTo(13);
  });
});
