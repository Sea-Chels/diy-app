import type { AreaId } from './data/areas';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import { createStore, stringList, type Selection } from '../shared/store';

export interface State extends Selection<AreaId> {
  setup: Setup;
  /** Plant ids in the bed planner; a plant repeats once per square or plant. */
  plan: string[];
}

export const store = createStore<State>(
  { setup: DEFAULT_SETUP, selected: null, openGuide: null, plan: [] },
  { setup: { key: 'diy-garden:setup', fix: fixSetup }, plan: { key: 'diy-garden:plan', fix: stringList } },
);

export const { getState, setState, subscribe } = store;

/** Select an area and optionally open one of its guides; null clears the selection. */
export const select = (area: AreaId | null, openGuide: string | null = null) => setState({ selected: area, openGuide });

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...getState().setup, ...patch } });
