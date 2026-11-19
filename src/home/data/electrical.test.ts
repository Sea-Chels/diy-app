import { describe, expect, it } from 'vitest';
import { GUIDES } from './guides';

// A step that has the user handle wiring; the lookarounds skip wire brushes, "check for wires and pipes" and a bent wire.
const WIRING = /\b(?<!bent )(wires?(?!-brush| and pipes)|wiring|terminals?|harness|connections?|backstab)\b/i;
const POWER_OFF = /\bunplug|\b(breakers?|circuits?|power)\b[^.]*\boff\b|\boff\b[^.]*\b(breakers?|circuits?|power)\b/i;
const ELECTRICAL = GUIDES.filter((g) => g.steps.some((s) => WIRING.test(s)));
// Installs whose opening step is a check that touches nothing; power still goes off before the wires.
const LOOKS_FIRST: Record<string, string> = { 'replace-thermostat': 'step 1 checks compatibility' };

describe('electrical guides', () => {
  it('are found', () => expect(ELECTRICAL.length).toBeGreaterThan(10));
  it('turn the power off before any step that touches wiring', () => {
    const late = ELECTRICAL.filter((g) => {
      const off = g.steps.findIndex((s) => POWER_OFF.test(s));
      return off < 0 || off > g.steps.findIndex((s) => WIRING.test(s));
    });
    expect(late.map((g) => g.id)).toEqual([]);
  });
  it('start installs and replacements by turning the power off', () => {
    const installs = ELECTRICAL.filter((g) => g.kind === 'install' && !Object.hasOwn(LOOKS_FIRST, g.id));
    expect(installs.filter((g) => !POWER_OFF.test(g.steps[0])).map((g) => g.id)).toEqual([]);
  });
});
