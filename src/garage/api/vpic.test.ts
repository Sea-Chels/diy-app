import { afterEach, describe, expect, it, vi } from 'vitest';
import { modelsForMakeYear } from './vpic';

const ok = (names: string[]) => new Response(JSON.stringify({ Results: names.map((Model_Name) => ({ Model_Name })) }));
// The client caches per make and year for the whole module, so each test asks for its own year.
let year = 2000;
const nextYear = () => year++;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('vPIC client', () => {
  it('asks for the make and year, URL-encoded', async () => {
    const fetch = vi.fn(async () => ok([]));
    vi.stubGlobal('fetch', fetch);
    const y = nextYear();
    await modelsForMakeYear('Land Rover', y);
    expect(fetch).toHaveBeenCalledWith(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/Land%20Rover/modelyear/${y}?format=json`);
  });
  it('trims, drops blanks and duplicates, and sorts', async () => {
    vi.stubGlobal('fetch', async () => ok(['Pilot ', 'Accord', ' ', 'Civic', 'Accord', 'CR-V']));
    expect(await modelsForMakeYear('Honda', nextYear())).toEqual(['Accord', 'Civic', 'CR-V', 'Pilot']);
  });
  it('caches each make and year', async () => {
    const fetch = vi.fn(async () => ok(['Camry']));
    vi.stubGlobal('fetch', fetch);
    const y = nextYear();
    await modelsForMakeYear('Toyota', y);
    expect(await modelsForMakeYear('Toyota', y)).toEqual(['Camry']);
    await modelsForMakeYear('Toyota', y + 100);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('rejects on an HTTP error and forgets it, so the next try refetches', async () => {
    const fetch = vi.fn(async () => new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetch);
    const y = nextYear();
    await expect(modelsForMakeYear('Ford', y)).rejects.toThrow('vPIC 503');
    fetch.mockResolvedValueOnce(ok(['Escape']));
    expect(await modelsForMakeYear('Ford', y)).toEqual(['Escape']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('rejects when offline and forgets it', async () => {
    const fetch = vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')));
    vi.stubGlobal('fetch', fetch);
    const y = nextYear();
    await expect(modelsForMakeYear('Kia', y)).rejects.toThrow('Failed to fetch');
    await expect(modelsForMakeYear('Kia', y)).rejects.toThrow('Failed to fetch');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('rejects on a malformed body', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}'));
    await expect(modelsForMakeYear('Mazda', nextYear())).rejects.toThrow();
  });
  // Known gap: fetch gets no AbortSignal, so a stalled vPIC leaves the model picker empty instead of falling back to the free-text box.
  it.fails('gives up on a request that never answers', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal!.reason))));
    const p = modelsForMakeYear('Subaru', nextYear());
    const settled = p.then(() => 'resolved', () => 'rejected');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await Promise.race([settled, Promise.resolve('pending')])).toBe('rejected');
  });
});
