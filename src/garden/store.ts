import type { AreaId } from './data/areas';
import { DEFAULT_SETUP, fixSetup, type Setup } from './data/setup';

export interface State {
  setup: Setup;
  selectedArea: AreaId | null;
  /** Guide expanded in the side panel. */
  openGuide: string | null;
  /** Plant ids in the bed planner. */
  plan: string[];
}

type Listener = (s: State, prev: State) => void;
const listeners = new Set<Listener>();
const SETUP_KEY = 'diy-garden:setup';
const PLAN_KEY = 'diy-garden:plan';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

let state: State = {
  setup: fixSetup({ ...DEFAULT_SETUP, ...load<Partial<Setup>>(SETUP_KEY, {}) }),
  selectedArea: null,
  openGuide: null,
  plan: load<string[]>(PLAN_KEY, []),
};

export const getState = () => state;

export function setState(patch: Partial<State>): void {
  const prev = state;
  state = { ...state, ...patch };
  if (patch.setup) {
    state.setup = fixSetup(state.setup);
    save(SETUP_KEY, state.setup);
  }
  if (patch.plan) save(PLAN_KEY, state.plan);
  listeners.forEach((l) => l(state, prev));
}

export const setSetup = (patch: Partial<Setup>) => setState({ setup: { ...state.setup, ...patch } });

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
