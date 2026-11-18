import type { PartId } from './data/parts';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import type { Build } from './data/compat';
import { asRecord, createStore, stringList, type Selection } from '../shared/store';

export interface State extends Selection<PartId> {
  setup: Setup;
  build: Build;
}

function fixBuild(raw: unknown): Build {
  const b = asRecord(raw);
  const build: Build = { storage: stringList(b.storage) };
  for (const k of ['cpu', 'board', 'ram', 'gpu', 'cooler', 'case', 'psu'] as const) if (typeof b[k] === 'string') build[k] = b[k];
  return build;
}

export const store = createStore<State>(
  { setup: DEFAULT_SETUP, build: { storage: [] }, selected: null, openGuide: null },
  { setup: { key: 'diy-pc:setup', fix: fixSetup }, build: { key: 'diy-pc:build', fix: fixBuild } },
);

export const { getState, setState, subscribe } = store;

/** Select a part and optionally open one of its guides; null clears the selection. */
export const select = (part: PartId | null, openGuide: string | null = null) => setState({ selected: part, openGuide });

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...getState().setup, ...patch } });
