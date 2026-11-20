// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { $ } from './dom';
import { must } from './must';

describe('must', () => {
  it('passes values through, falsy ones included', () => {
    expect(must(0, 'zero')).toBe(0);
    expect(must('', 'empty')).toBe('');
  });
  it('names what was missing', () => {
    expect(() => must(null, 'loop button')).toThrow('Missing loop button');
    expect(() => must(undefined, 'plant pawpaw')).toThrow('Missing plant pawpaw');
  });
});

describe('$', () => {
  it('finds an element, under a root when given one, or names the selector', () => {
    document.body.innerHTML = '<p id="a"><b class="x"></b></p><b class="x" id="out"></b>';
    expect($('#a').id).toBe('a');
    expect($('.x', $('#a')).id).toBe('');
    expect(() => $('#nope')).toThrow('Missing #nope');
  });
});
