import type { AreaId } from './data/areas';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import { createStore, stringList } from '../shared/store';

export interface State {
  setup: Setup;
  selectedArea: AreaId | null;
  openGuide: string | null;
  /** Plant ids in the bed planner; a plant repeats once per square or plant. */
  plan: string[];
}

export const { getState, setState, subscribe } = createStore<State>(
  { setup: DEFAULT_SETUP, selectedArea: null, openGuide: null, plan: [] },
  { setup: { key: 'diy-garden:setup', fix: fixSetup }, plan: { key: 'diy-garden:plan', fix: stringList } },
);

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...getState().setup, ...patch } });
