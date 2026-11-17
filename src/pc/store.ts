import type { PartId } from './data/parts';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';
import type { Build } from './data/compat';

export interface State {
  setup: Setup;
  build: Build;
  selectedPart: PartId | null;
  /** Guide expanded in the side panel. */
  openGuide: string | null;
}

type Listener = (s: State, prev: State) => void;
const listeners = new Set<Listener>();
const SETUP_KEY = 'diy-pc:setup';
const BUILD_KEY = 'diy-pc:build';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...fallback };
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

let state: State = {
  setup: fixSetup(load(SETUP_KEY, DEFAULT_SETUP)),
  build: load<Build>(BUILD_KEY, { storage: [] }),
  selectedPart: null,
  openGuide: null,
};

export const getState = () => state;

export function setState(patch: Partial<State>): void {
  const prev = state;
  state = { ...state, ...patch };
  if (patch.setup) {
    state.setup = fixSetup(state.setup);
    save(SETUP_KEY, state.setup);
  }
  if (patch.build) save(BUILD_KEY, state.build);
  listeners.forEach((l) => l(state, prev));
}

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...state.setup, ...patch } });

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
