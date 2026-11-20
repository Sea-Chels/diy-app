type Listener<S> = (s: S, prev: S) => void;

export interface Store<S> {
  getState(): S;
  setState(patch: Partial<S>): void;
  subscribe(l: Listener<S>): () => void;
}

/** What every workshop's state has: the selected spot and the guide open in its panel. */
export interface Selection<S extends string> {
  selected: S | null;
  openGuide: string | null;
}

/** How a field is saved: its localStorage key, and how to turn whatever is stored there back into a valid value. */
export type Persist<S> = { [K in keyof S]?: { key: string; fix: (raw: unknown) => S[K] } };

function load(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the page still works, it just forgets.
  }
}

export function createStore<S extends object>(defaults: S, persist: Persist<S>): Store<S> {
  const listeners = new Set<Listener<S>>();
  const fields = Object.entries(persist) as [keyof S, { key: string; fix: (raw: unknown) => S[keyof S] }][];
  let state: S = { ...defaults };
  for (const [k, f] of fields) state[k] = f.fix(load(f.key));

  return {
    getState: (): S => state,
    setState(patch: Partial<S>): void {
      const prev = state;
      state = { ...state, ...patch };
      for (const [k, f] of fields) {
        if (!(k in patch)) continue;
        state[k] = f.fix(state[k]);
        save(f.key, state[k]);
      }
      for (const l of listeners) l(state, prev);
    },
    subscribe(l: Listener<S>): () => void {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export const stringList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** `v` if it's one of the keys of `labels`, else `fallback`. */
export const oneOf = <K extends string>(v: unknown, labels: Record<K, unknown>, fallback: K): K =>
  typeof v === 'string' && Object.hasOwn(labels, v) ? (v as K) : fallback;
