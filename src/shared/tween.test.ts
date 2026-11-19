import { describe, expect, it } from 'vitest';
import { cancelTweens, tween, tweenScope, updateTweens } from './tween';

describe('updateTweens', () => {
  it('runs each live tween once even when one cancels another mid-frame', () => {
    const runs = { a: 0, b: 0, c: 0 };
    tween({ duration: 1000, tag: 'a', update: () => runs.a++ });
    tween({ duration: 1000, tag: 'b', update: () => runs.b++ });
    tween({ duration: 1000, tag: 'c', update: () => { runs.c++; cancelTweens('a'); } });
    updateTweens(performance.now());
    expect(runs).toEqual({ a: 0, b: 1, c: 1 });
    cancelTweens('b');
    cancelTweens('c');
  });

  it('keeps tags in two scopes apart and stops one scope at once', () => {
    const one = tweenScope();
    const two = tweenScope();
    const runs = { one: 0, two: 0 };
    one.tween({ duration: 1000, tag: 'lid', update: () => runs.one++ });
    two.tween({ duration: 1000, tag: 'lid', update: () => runs.two++ });
    updateTweens(performance.now());
    expect(runs).toEqual({ one: 1, two: 1 });
    one.stop();
    updateTweens(performance.now());
    expect(runs).toEqual({ one: 1, two: 2 });
    two.stop();
  });
});
