import { describe, expect, it } from '@jest/globals';
import { addIfNotNull, addOrCreateIfNotNull } from '../array-utils.ts';

describe('array-utils', () => {
  it('adIfNotNull', () => {
    expect(addIfNotNull([], undefined)).toEqual([]);
    expect(addIfNotNull([], 'test')).toEqual(['test']);
    expect(addIfNotNull(['test'], 'test2')).toEqual(['test', 'test2']);
    expect(addIfNotNull(addIfNotNull([], 'test'), 'test2')).toEqual(['test', 'test2']);
  });
  it('addOrCreateIfNotNull', () => {
    expect(addOrCreateIfNotNull(undefined, undefined)).toBeUndefined();
    expect(addOrCreateIfNotNull([], undefined)).toEqual([]);
    expect(addOrCreateIfNotNull([], 'test')).toEqual(['test']);
    expect(addOrCreateIfNotNull(['test'], 'test2')).toEqual(['test', 'test2']);
    expect(addOrCreateIfNotNull(undefined, 'test')).toEqual(['test']);
    expect(addOrCreateIfNotNull(addOrCreateIfNotNull(undefined, 'test'), 'test2')).toEqual(['test', 'test2']);
  });
});
