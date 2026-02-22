import { describe, expect, it } from '@jest/globals';
import {
  minTimestamp,
  maxTimestamp,
  isTimestampInRange,
  addDays,
  addWeeks,
  fromIsoDatePart,
  toIsoDatePart,
} from '../time-utils.ts';

const startAt = '2024-01-01T07:00:05.000Z';
const endAt = '2024-06-01T07:00:05.000Z';
const timestampInside = '2024-02-25T07:00:05.000Z';
const timestampBefore = '2023-06-25T07:00:05.000Z';
const timestampAfter = '2025-06-25T07:00:05.000Z';

describe('time-utils', () => {
  it('minTimestamp', () => {
    expect(minTimestamp(timestampBefore, null)).toEqual(timestampBefore);
    expect(minTimestamp(timestampBefore, timestampBefore)).toEqual(timestampBefore);
    expect(minTimestamp(timestampBefore, startAt)).toEqual(timestampBefore);
    expect(minTimestamp(startAt, timestampBefore)).toEqual(timestampBefore);
  });

  it('maxTimestamp', () => {
    expect(maxTimestamp(timestampBefore, null)).toEqual(timestampBefore);
    expect(maxTimestamp(timestampBefore, timestampBefore)).toEqual(timestampBefore);
    expect(maxTimestamp(timestampBefore, startAt)).toEqual(startAt);
    expect(maxTimestamp(startAt, timestampBefore)).toEqual(startAt);
  });

  it('isTimestampInRange', () => {
    expect(isTimestampInRange(timestampBefore, null, null)).toBe(true);
    expect(isTimestampInRange(timestampBefore, startAt, null)).toBe(false);
    expect(isTimestampInRange(timestampBefore, null, endAt)).toBe(true);
    expect(isTimestampInRange(timestampBefore, startAt, endAt)).toBe(false);

    expect(isTimestampInRange(timestampInside, startAt, null)).toBe(true);
    expect(isTimestampInRange(timestampInside, null, endAt)).toBe(true);
    expect(isTimestampInRange(timestampInside, startAt, endAt)).toBe(true);

    expect(isTimestampInRange(timestampAfter, startAt, null)).toBe(true);
    expect(isTimestampInRange(timestampAfter, null, endAt)).toBe(false);
    expect(isTimestampInRange(timestampAfter, startAt, endAt)).toBe(false);

    // start of range is inclusive, end of range is exclusive
    expect(isTimestampInRange(startAt, startAt, endAt)).toBe(true);
    expect(isTimestampInRange(endAt, startAt, endAt)).toBe(false);
  });

  it('addDays', () => {
    const currentDate = new Date('2024-12-18');
    expect(addDays(currentDate).toISOString()).toBe('2024-12-19T00:00:00.000Z');
    expect(addDays(currentDate, 2).toISOString()).toBe('2024-12-20T00:00:00.000Z');
    expect(addDays(currentDate, 0).toISOString()).toBe('2024-12-18T00:00:00.000Z');
    expect(addDays(currentDate, -1).toISOString()).toBe('2024-12-17T00:00:00.000Z');
    expect(addDays(currentDate, -365).toISOString()).toBe('2023-12-19T00:00:00.000Z');
  });

  it('addWeeks', () => {
    const currentDate = new Date('2024-12-18');
    expect(addWeeks(currentDate).toISOString()).toBe('2024-12-25T00:00:00.000Z'); // adds 1 week
    expect(addWeeks(currentDate, 2).toISOString()).toBe('2025-01-01T00:00:00.000Z'); // adds 2 weeks
    expect(addWeeks(currentDate, 0).toISOString()).toBe('2024-12-18T00:00:00.000Z');
    expect(addWeeks(currentDate, -1).toISOString()).toBe('2024-12-11T00:00:00.000Z'); // subtracts 1 week
  });

  it('toIsoDatePart', () => {
    expect(toIsoDatePart(new Date('2024-12-18T00:00:00.000Z'))).toBe('2024-12-18');
  });

  it('fromIsoDatePart', () => {
    expect(fromIsoDatePart('2024-12-18').toISOString()).toBe('2024-12-18T00:00:00.000Z');
  });
});
