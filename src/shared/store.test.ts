import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore, oneOf, stringList } from './store';

const saved = new Map<string, string>();
beforeEach(() => {
  saved.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => saved.get(k) ?? null,
    setItem: (k: string, v: string) => saved.set(k, v),
  });
});

const COLORS = { red: 'Red', blue: 'Blue' };
const make = () =>
  createStore({ color: 'red' as keyof typeof COLORS, tags: [] as string[], open: false }, {
    color: { key: 't:color', fix: (v) => oneOf(v, COLORS, 'red') },
    tags: { key: 't:tags', fix: stringList },
  });

describe('createStore', () => {
  it('loads saved fields and repairs bad ones', () => {
    saved.set('t:color', JSON.stringify('green'));
    saved.set('t:tags', JSON.stringify(['a', 3, 'b']));
    expect(make().getState()).toEqual({ color: 'red', tags: ['a', 'b'], open: false });
  });
  it('saves only persisted fields that change', () => {
    const s = make();
    s.setState({ open: true });
    expect(saved.size).toBe(0);
    s.setState({ color: 'blue' });
    expect(saved.get('t:color')).toBe('"blue"');
  });
  it('tells listeners the new and previous state', () => {
    const s = make();
    const seen: [boolean, boolean][] = [];
    s.subscribe((now, prev) => seen.push([now.open, prev.open]));
    s.setState({ open: true });
    expect(seen).toEqual([[true, false]]);
  });
  it('still works when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } });
    const s = make();
    s.setState({ color: 'blue' });
    expect(s.getState().color).toBe('blue');
  });
});
