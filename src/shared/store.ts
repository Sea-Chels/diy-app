type Listener<S> = (s: S, prev: S) => void;

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

export function createStore<S extends object>(defaults: S, persist: Persist<S>) {
  const listeners = new Set<Listener<S>>();
  const fields = Object.keys(persist) as (keyof S)[];
  let state: S = { ...defaults };
  for (const k of fields) state[k] = persist[k]!.fix(load(persist[k]!.key));

  return {
    getState: (): S => state,
    setState(patch: Partial<S>): void {
      const prev = state;
      state = { ...state, ...patch };
      for (const k of fields) {
        if (!(k in patch)) continue;
        state[k] = persist[k]!.fix(state[k]);
        save(persist[k]!.key, state[k]);
      }
      listeners.forEach((l) => l(state, prev));
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
