import { describe, expect, it } from 'vitest';
import type { Powertrain } from './guides';
import { guessBody, guessPowertrain } from './makes';
import type { BodyKind } from './paint';

// An EV guess hides every oil, spark plug and filter guide, so the ev/non-ev line matters most.
const POWERTRAINS: [string, string, Powertrain][] = [
  ['Tesla', 'Model 3', 'ev'],
  ['Tesla', 'Cybertruck', 'ev'],
  ['Rivian', 'R1S', 'ev'],
  ['Lucid', 'Air', 'ev'],
  ['Polestar', '2', 'ev'],
  ['Nissan', 'Leaf', 'ev'],
  ['Nissan', 'Ariya', 'ev'],
  ['Chevrolet', 'Bolt EUV', 'ev'],
  ['Chevrolet', 'Spark EV', 'ev'],
  ['Chevrolet', 'Silverado EV', 'ev'],
  ['Chevrolet', 'Equinox EV', 'ev'],
  ['Ford', 'Mustang Mach-E', 'ev'],
  ['Ford', 'F-150 Lightning', 'ev'],
  ['Ford', 'Focus Electric', 'ev'],
  ['Hyundai', 'Ioniq 5', 'ev'],
  ['Hyundai', 'Kona Electric', 'ev'],
  ['Kia', 'EV6', 'ev'],
  ['Kia', 'Niro EV', 'ev'],
  ['Volkswagen', 'ID.4', 'ev'],
  ['Volkswagen', 'e-Golf', 'ev'],
  ['Audi', 'Q4 e-tron', 'ev'],
  ['BMW', 'i3', 'ev'],
  ['BMW', 'iX', 'ev'],
  ['Mercedes-Benz', 'EQS', 'ev'],
  ['Porsche', 'Taycan', 'ev'],
  ['Mini', 'Cooper SE', 'ev'],
  ['Fiat', '500e', 'ev'],
  ['Honda', 'Clarity Electric', 'ev'],
  ['Honda', 'Prologue', 'ev'],
  ['Toyota', 'bZ4X', 'ev'],
  ['Toyota', 'Mirai', 'ev'],
  ['Toyota', 'Prius', 'hybrid'],
  ['Toyota', 'Prius Prime', 'hybrid'],
  ['Toyota', 'RAV4 Prime', 'hybrid'],
  ['Toyota', 'Camry Hybrid', 'hybrid'],
  ['Honda', 'Insight', 'hybrid'],
  ['Honda', 'Clarity', 'hybrid'],
  ['Chevrolet', 'Volt', 'hybrid'],
  ['Ford', 'Fusion Energi', 'hybrid'],
  ['Hyundai', 'Ioniq', 'hybrid'],
  ['Hyundai', 'Ioniq Plug-in Hybrid', 'hybrid'],
  ['Kia', 'Niro', 'hybrid'],
  ['Mitsubishi', 'Outlander PHEV', 'hybrid'],
  ['Chrysler', 'Pacifica Hybrid', 'hybrid'],
  ['Porsche', 'Cayenne E-Hybrid', 'hybrid'],
  ['Volkswagen', 'Jetta TDI', 'diesel'],
  ['Ram', '2500 Cummins', 'diesel'],
  ['Chevrolet', 'Silverado 2500HD Duramax', 'diesel'],
  ['Ford', 'F-250 Power Stroke', 'diesel'],
  ['Jeep', 'Grand Cherokee EcoDiesel', 'diesel'],
  ['Mercedes-Benz', 'E-Class BlueTEC', 'diesel'],
  ['Toyota', 'Camry', 'gas'],
  ['Honda', 'Civic', 'gas'],
  ['Honda', 'Fit', 'gas'],
  ['Chevrolet', 'Spark', 'gas'],
  ['Chevrolet', 'Silverado 1500', 'gas'],
  ['Hyundai', 'Kona', 'gas'],
  ['Ford', 'Mustang', 'gas'],
  ['BMW', '330i', 'gas'],
  ['Subaru', 'WRX', 'gas'],
  ['', '', 'gas'],
];

// Known misses, kept as failing expectations so they flip to errors once makes.ts learns them.
const POWERTRAIN_MISSES: [string, string, Powertrain, string][] = [
  ['Audi', 'A3 Sportback e-tron', 'hybrid', 'a plug-in hybrid with an engine, guessed ev'],
  ['Jaguar', 'I-Pace', 'ev', 'guessed gas'],
  ['Volvo', 'EX30', 'ev', 'guessed gas'],
  ['Volvo', 'C40 Recharge', 'ev', 'guessed gas'],
  ['Hyundai', 'Ioniq Electric', 'ev', '"ioniq" alone wins: guessed hybrid'],
  ['Hyundai', 'Ioniq 9', 'ev', '"ioniq" alone wins: guessed hybrid'],
  ['Mazda', 'MX-30', 'ev', 'guessed gas'],
  ['GMC', 'Sierra EV', 'ev', 'guessed gas'],
  ['Cadillac', 'Escalade IQ', 'ev', 'guessed gas'],
  ['Ford', 'E-Transit', 'ev', 'guessed gas'],
  ['Mitsubishi', 'i-MiEV', 'ev', 'guessed gas'],
  ['Lexus', 'CT 200h', 'hybrid', 'the "lexus (ct|…)" branch tests the model, which never contains "Lexus"'],
  ['Lexus', 'RX 450h', 'hybrid', 'same dead "lexus" branch'],
  ['BMW', 'i8', 'hybrid', 'guessed gas'],
  ['Jeep', 'Wrangler 4xe', 'hybrid', 'guessed gas'],
];

describe('guessPowertrain', () => {
  for (const [make, model, want] of POWERTRAINS) it(`${make} ${model || '(blank)'} is ${want}`, () => expect(guessPowertrain(make, model)).toBe(want));
  it('ignores case', () => {
    expect(guessPowertrain('tesla', 'model y')).toBe('ev');
    expect(guessPowertrain('TOYOTA', 'PRIUS')).toBe('hybrid');
  });
  for (const [make, model, want, why] of POWERTRAIN_MISSES) it.fails(`known miss: ${make} ${model} should be ${want} (${why})`, () => expect(guessPowertrain(make, model)).toBe(want));
});

const BODIES: [string, string, BodyKind][] = [
  ['Honda', 'CR-V', 'suv'],
  ['Honda', 'CRV', 'suv'],
  ['Honda', 'Civic', 'sedan'],
  ['Honda', 'Odyssey', 'suv'],
  ['Tesla', 'Model Y', 'suv'],
  ['Tesla', 'Model X', 'suv'],
  ['Tesla', 'Model 3', 'sedan'],
  ['Ford', 'F-150', 'suv'],
  ['Ford', 'F-250 Super Duty', 'suv'],
  ['Ford', 'Mustang', 'sedan'],
  ['Ford', 'Mustang Mach-E', 'suv'],
  ['Jeep', 'Compass', 'suv'],
  [' Jeep ', 'Anything', 'suv'],
  ['Land Rover', 'Range Rover', 'suv'],
  ['Rivian', 'R1T', 'suv'],
  ['Toyota', 'RAV4 Prime', 'suv'],
  ['Toyota', 'Corolla', 'sedan'],
  ['Toyota', 'Corolla Cross', 'suv'],
  ['BMW', 'X5', 'suv'],
  ['BMW', 'M3', 'sedan'],
  ['Audi', 'Q5', 'suv'],
  ['Audi', 'A4', 'sedan'],
  ['Infiniti', 'Q50', 'sedan'],
  ['Infiniti', 'QX60', 'suv'],
  ['Genesis', 'GV80', 'suv'],
  ['Genesis', 'G80', 'sedan'],
  ['Volvo', 'XC90', 'suv'],
  ['Volvo', 'S60', 'sedan'],
  ['Lexus', 'RX', 'suv'],
  ['Lexus', 'ES', 'sedan'],
  ['Subaru', 'Outback', 'suv'],
  ['Subaru', 'WRX', 'sedan'],
  ['Mazda', 'CX-5', 'suv'],
  ['Mazda', 'MX-5 Miata', 'sedan'],
  ['Mercedes-Benz', 'GLC', 'suv'],
  ['Mercedes-Benz', 'C-Class', 'sedan'],
  ['Mini', 'Countryman', 'suv'],
  ['Mini', 'Cooper', 'sedan'],
  ['Kia', 'Soul', 'suv'],
  ['Kia', 'Forte', 'sedan'],
  ['Hyundai', 'Elantra', 'sedan'],
  ['', '', 'sedan'],
];

// Cosmetic (it only picks the 3D body, and the paint shop can override it), but worth knowing.
const BODY_MISSES: [string, string][] = [
  ['Buick', 'Enclave'],
  ['Buick', 'Encore'],
  ['Dodge', 'Grand Caravan'],
  ['Toyota', 'FJ Cruiser'],
  ['Honda', 'Element'],
];

describe('guessBody', () => {
  for (const [make, model, want] of BODIES) it(`${make.trim()} ${model || '(blank)'} is ${want}`, () => expect(guessBody(make, model)).toBe(want));
  for (const [make, model] of BODY_MISSES) it.fails(`known miss: ${make} ${model} should be suv`, () => expect(guessBody(make, model)).toBe('suv'));
});
