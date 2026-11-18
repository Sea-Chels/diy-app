import type { PartId } from './data/parts';
import { POWERTRAIN_LABEL, type Powertrain } from './data/guides';
import { BODY_LABEL, FINISHES, SWATCHES, type BodyChoice, type Finish } from './data/paint';
import { YEARS } from './data/makes';
import { asRecord, createStore, oneOf } from '../shared/store';

export interface Vehicle {
  year: number | null;
  make: string;
  model: string;
  powertrain: Powertrain;
}

export interface Appearance {
  color: string;
  finish: Finish;
  body: BodyChoice;
}

export interface State {
  vehicle: Vehicle;
  appearance: Appearance;
  selectedPart: PartId | null;
  openGuide: string | null;
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');

function fixVehicle(raw: unknown): Vehicle {
  const v = asRecord(raw);
  return {
    year: typeof v.year === 'number' && YEARS.includes(v.year) ? v.year : null,
    make: text(v.make),
    model: text(v.model),
    powertrain: oneOf(v.powertrain, POWERTRAIN_LABEL, 'gas'),
  };
}

function fixAppearance(raw: unknown): Appearance {
  const a = asRecord(raw);
  return {
    color: typeof a.color === 'string' && /^#[0-9a-f]{6}$/i.test(a.color) ? a.color : SWATCHES[0].hex,
    finish: oneOf(a.finish, FINISHES, 'gloss'),
    body: oneOf(a.body, BODY_LABEL, 'auto'),
  };
}

export const { getState, setState, subscribe } = createStore<State>(
  { vehicle: fixVehicle(null), appearance: fixAppearance(null), selectedPart: null, openGuide: null },
  { vehicle: { key: 'diy-garage:vehicle', fix: fixVehicle }, appearance: { key: 'diy-garage:appearance', fix: fixAppearance } },
);

export const vehicleLabel = (v: Vehicle) => [v.year, v.make, v.model].filter(Boolean).join(' ');

export const hasVehicle = (v: Vehicle) => Boolean(v.year && v.make && v.model);
