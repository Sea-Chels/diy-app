import { describe, expect, it } from 'vitest';
import { DEFAULT_SETUP, fixSetup } from './setup';

describe('fixSetup', () => {
  it('falls back to the defaults for nothing saved or junk', () => {
    expect(fixSetup(undefined)).toEqual(DEFAULT_SETUP);
    expect(fixSetup('mid')).toEqual(DEFAULT_SETUP);
    expect(fixSetup({ size: 'huge', gpu: 3, rgbColor: 'blue', caseColor: '#12345' })).toEqual(DEFAULT_SETUP);
  });
  it('keeps a valid setup as saved', () => {
    const s = { size: 'full', cooling: 'loop', gpu: 'triple', rgb: 'solid', rgbColor: '#ff4fd8', caseColor: '#e8e8ee' };
    expect(fixSetup(s)).toEqual(s);
  });
  it('swaps a custom loop for an AIO in a Mini-ITX case', () => {
    expect(fixSetup({ size: 'itx', cooling: 'loop' })).toMatchObject({ size: 'itx', cooling: 'aio' });
  });
});
