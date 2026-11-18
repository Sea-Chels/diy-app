import { rideOf, type PartId } from './data/parts';
import type { RideId } from './data/rides';
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
  /** The vehicle the camera is on; picking a part moves it to that part's vehicle. */
  ride: RideId;
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
  { vehicle: fixVehicle(null), appearance: fixAppearance(null), ride: 'car', selectedPart: null, openGuide: null },
  { vehicle: { key: 'diy-garage:vehicle', fix: fixVehicle }, appearance: { key: 'diy-garage:appearance', fix: fixAppearance } },
);

export const vehicleLabel = (v: Vehicle) => [v.year, v.make, v.model].filter(Boolean).join(' ');

export const hasVehicle = (v: Vehicle) => Boolean(v.year && v.make && v.model);

/** Select a part (and optionally open one of its guides), moving to the part's vehicle; null clears the selection. */
export function select(part: PartId | null, openGuide: string | null = null): void {
  setState({ selectedPart: part, openGuide, ...(part ? { ride: rideOf(part) } : {}) });
}
