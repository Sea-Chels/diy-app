import type { AreaId } from './data/areas';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import { createStore, stringList, type Selection } from '../shared/store';

export interface State extends Selection<AreaId> {
  setup: Setup;
  /** Tool ids from data/tools.ts. */
  owned: string[];
}

export const store = createStore<State>(
  { setup: DEFAULT_SETUP, selected: null, openGuide: null, owned: [] },
  { setup: { key: 'diy-home:setup', fix: fixSetup }, owned: { key: 'diy-home:tools', fix: stringList } },
);

export const { getState, setState, subscribe } = store;

/** Select an area and optionally open one of its guides; null clears the selection. */
export const select = (area: AreaId | null, openGuide: string | null = null) => setState({ selected: area, openGuide });

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...getState().setup, ...patch } });
