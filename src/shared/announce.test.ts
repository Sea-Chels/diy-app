// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resultAnnouncer } from './announce';

const region = () => document.querySelector('[role="status"]')?.textContent ?? '';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('resultAnnouncer', () => {
  it('stays quiet on the first draw and on repeats, and says changes', () => {
    const say = resultAnnouncer();
    say('No clashes found');
    vi.runAllTimers();
    expect(region()).toBe('');
    say('1 problem to fix');
    vi.runAllTimers();
    expect(region()).toBe('1 problem to fix');
    say('1 problem to fix');
    vi.runAllTimers();
    expect(region()).toBe('1 problem to fix');
    say('No clashes found');
    vi.runAllTimers();
    expect(region()).toBe('No clashes found');
  });
});
