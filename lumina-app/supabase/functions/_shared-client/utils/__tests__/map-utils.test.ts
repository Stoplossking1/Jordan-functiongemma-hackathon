import { describe, expect, it } from '@jest/globals';
import { getOrAddArray } from '../map-utils.ts';

describe('map-utils', () => {
  it('getOrAddArray', () => {
    const map = new Map<string, number[]>();

    // Test getting array for new key
    const arr1 = getOrAddArray(map, 'key1');
    expect(arr1).toEqual([]);
    expect(map.has('key1')).toBe(true);

    // Test array is mutable
    arr1.push(1, 2, 3);
    expect(map.get('key1')).toEqual([1, 2, 3]);

    // Test getting existing array returns same instance
    const arr2 = getOrAddArray(map, 'key1');
    expect(arr2).toBe(arr1);
    expect(arr2).toEqual([1, 2, 3]);

    // Test multiple keys
    const arr3 = getOrAddArray(map, 'key2');
    expect(arr3).toEqual([]);
    expect(map.size).toBe(2);
  });
});
