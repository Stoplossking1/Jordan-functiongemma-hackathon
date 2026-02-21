import { describe, expect, it } from '@jest/globals';
import { isUuid, parseStringToInt } from '../conversion-utils.ts';

describe('isUuid', () => {
  it('should accept valid UUID with dashes', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should accept valid UUID without dashes', () => {
    expect(isUuid('550e8400e29b41d4a716446655440000')).toBe(true);
  });

  it('invalid UUID format', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
  });

  it('UUID with incorrect length', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
  });

  it('UUID with invalid characters', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
  });

  it('should accept UUID with uppercase letters', () => {
    expect(isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('should accept UUID with mixed case letters', () => {
    expect(isUuid('550e8400-E29b-41d4-A716-446655440000')).toBe(true);
  });

  it('should accept uppercase UUID without dashes', () => {
    expect(isUuid('550E8400E29B41D4A716446655440000')).toBe(true);
  });
});

describe('parseStringToInt', () => {
  it('should parse valid integer string', () => {
    expect(parseStringToInt('123')).toBe(123);
  });

  it('should parse negative integer string', () => {
    expect(parseStringToInt('-456')).toBe(-456);
  });

  it('should parse integer with leading zeros', () => {
    expect(parseStringToInt('00789')).toBe(789);
  });

  it('should return undefined for empty string', () => {
    expect(parseStringToInt('')).toBeUndefined();
  });

  it('should return undefined for null input', () => {
    expect(parseStringToInt(null)).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    expect(parseStringToInt(undefined)).toBeUndefined();
  });

  it('should return undefined for non-integer string', () => {
    expect(parseStringToInt('abc')).toBeUndefined();
  });

  it('should truncate decimal numbers', () => {
    expect(parseStringToInt('123.45')).toBe(123);
  });

  it('should parse with custom radix', () => {
    expect(parseStringToInt('FF', 16)).toBe(255);
  });
});
