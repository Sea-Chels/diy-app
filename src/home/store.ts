import type { AreaId } from './data/areas';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import { createStore, stringList } from '../shared/store';

export interface State {
  setup: Setup;
  selectedArea: AreaId | null;
  openGuide: string | null;
  /** Tool ids from data/tools.ts. */
  owned: string[];
}

export const { getState, setState, subscribe } = createStore<State>(
  { setup: DEFAULT_SETUP, selectedArea: null, openGuide: null, owned: [] },
  { setup: { key: 'diy-home:setup', fix: fixSetup }, owned: { key: 'diy-home:tools', fix: stringList } },
);

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...getState().setup, ...patch } });
