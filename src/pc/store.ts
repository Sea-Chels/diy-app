import type { PartId } from './data/parts';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import type { Build } from './data/compat';
import { asRecord, createStore, stringList } from '../shared/store';

export interface State {
  setup: Setup;
  build: Build;
  selectedPart: PartId | null;
  openGuide: string | null;
}

function fixBuild(raw: unknown): Build {
  const b = asRecord(raw);
  const build: Build = { storage: stringList(b.storage) };
  for (const k of ['cpu', 'board', 'ram', 'gpu', 'cooler', 'case', 'psu'] as const) if (typeof b[k] === 'string') build[k] = b[k];
  return build;
}

export const { getState, setState, subscribe } = createStore<State>(
  { setup: DEFAULT_SETUP, build: { storage: [] }, selectedPart: null, openGuide: null },
  { setup: { key: 'diy-pc:setup', fix: fixSetup }, build: { key: 'diy-pc:build', fix: fixBuild } },
);

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...getState().setup, ...patch } });
