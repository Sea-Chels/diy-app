// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { closeModal } from '../../shared/modal';
import { openCalculators } from './calculators';

beforeEach(() => {
  closeModal(false);
  document.body.innerHTML = '<div id="modal-root"></div>';
});

const result = () => [...document.querySelectorAll('.calc-result p')].map((p) => p.textContent);
const field = (label: string) => [...document.querySelectorAll('.calc-field')].find((f) => f.textContent === label)!.querySelector('input')!;
function type(label: string, value: string): void {
  const input = field(label);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('paint calculator', () => {
  it('starts on a 12 × 10 × 8 room with a door, two windows and two coats', () => {
    openCalculators();
    // 2 × (12 + 10) × 8 = 352, less 20 for the door and 15 per window = 302 sq ft; × 2 coats ÷ 350 = 1.73 gal = 7 quarts.
    expect(result()).toEqual(['1.7 gal', '302 sq ft to paint × 2 coats.', 'Buy 1 gallon and 3 quarts. Textured walls and dark-to-light changes take more.']);
  });
  it('adds the ceiling when asked', () => {
    openCalculators();
    const ceil = document.querySelector<HTMLInputElement>('.calc-check input')!;
    ceil.checked = true;
    ceil.dispatchEvent(new Event('change'));
    expect(result()[1]).toBe('422 sq ft to paint × 2 coats.');
  });
  it('says whole gallons without quarts, and one coat in the singular', () => {
    openCalculators();
    type('Coats', '1');
    type('Doors', '0');
    type('Windows', '0');
    type('Room length (ft)', '10.875');
    type('Room width (ft)', '11');
    // 2 × 21.875 × 8 = 350 sq ft: exactly one gallon.
    expect(result()).toEqual(['1.0 gal', '350 sq ft to paint × 1 coat.', 'Buy 1 gallon. Textured walls and dark-to-light changes take more.']);
  });
  it('never goes below zero when openings outnumber the wall', () => {
    openCalculators();
    type('Windows', '100');
    type('Room length (ft)', '-5');
    expect(result()[0]).toBe('0.0 gal');
  });
});

describe('flooring calculator', () => {
  it('adds waste and rounds up to whole boxes', () => {
    openCalculators('floor');
    // 120 sq ft + 10% = 132 sq ft ÷ 20 per box = 6.6, so 7 boxes.
    expect(result().slice(0, 2)).toEqual(['7 boxes', '120 sq ft of floor, 132 sq ft with 10% waste.']);
  });
  it('says box in the singular and survives a zero box size', () => {
    openCalculators('floor');
    type('Sq ft per box', '200');
    expect(result()[0]).toBe('1 box');
    type('Sq ft per box', '0');
    expect(result()[0]).toBe('0 boxes');
  });
});

describe('wire and breaker chart', () => {
  const rows = () => [...document.querySelectorAll('.wire-table tbody tr')].map((r) => [...r.children].map((c) => c.textContent));
  it('matches the NEC 240.4(D) small-conductor limits for copper', () => {
    openCalculators('wire');
    const awg = new Map(rows().map(([breaker, wire]) => [wire, breaker]));
    expect(awg.get('14 AWG')).toBe('15 A');
    expect(awg.get('12 AWG')).toBe('20 A');
    expect(awg.get('10 AWG')).toBe('30 A');
  });
  it('sizes range circuits for NM cable at 60 °C: 8 AWG for 40 A, 6 AWG for 50 A', () => {
    openCalculators('wire');
    const awg = new Map(rows().map(([breaker, wire]) => [wire, breaker]));
    expect(awg.get('8 AWG')).toBe('40 A');
    expect(awg.get('6 AWG')).toBe('50 A');
    expect(rows().every(([b, w]) => /^\d+ A$/.test(b!) && /^\d+ AWG$/.test(w!)), 'one size per row').toBe(true);
  });
  it('pairs bigger breakers with thicker wire, row by row', () => {
    openCalculators('wire');
    const amps = rows().map(([b]) => Number.parseInt(b!, 10));
    const gauges = rows().map(([, w]) => Number.parseInt(w!, 10));
    expect(amps).toEqual([...amps].sort((a, b) => a - b));
    expect(gauges).toEqual([...gauges].sort((a, b) => b - a));
  });
});

describe('calculator tabs', () => {
  it('switch between calculators', () => {
    openCalculators('wire');
    [...document.querySelectorAll<HTMLButtonElement>('.filter-row button')].find((b) => b.textContent === 'Flooring')!.click();
    expect(document.querySelector('.wire-table')).toBeNull();
    expect(result()[0]).toBe('7 boxes');
  });
});
