import { describe, expect, it } from 'vitest';
import { guideBook, type GuideBase } from './guides';

const guide = (id: string, ...spots: [string, ...string[]]): GuideBase =>
  ({ id, title: id, spots, aliases: [], difficulty: 1, minutes: [5, 10], tools: [], supplies: [], summary: '', steps: ['x'], query: id });

describe('guideBook', () => {
  const book = guideBook([guide('a', 'sink'), guide('b', 'toilet', 'sink'), guide('c', 'toilet')]);
  it('finds a spot’s guides in book order, including ones listed there second', () => {
    expect(book.forSpot('sink').map((g) => g.id)).toEqual(['a', 'b']);
    expect(book.forSpot('toilet').map((g) => g.id)).toEqual(['b', 'c']);
    expect(book.forSpot('nowhere')).toEqual([]);
  });
  it('looks guides up by id', () => {
    expect(book.byId.get('c')?.spots).toEqual(['toilet']);
  });
});
