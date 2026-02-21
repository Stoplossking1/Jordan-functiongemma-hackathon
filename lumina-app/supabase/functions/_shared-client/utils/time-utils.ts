import { toZonedTime } from 'date-fns-tz';
import { endOfWeek, formatISO, isToday, parseISO, startOfWeek } from 'date-fns';

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// we are assuming timestamp strings are valid and strings "sort" logically
export function minTimestamp(timestamp: string, timestamp2?: string | null): string {
  return timestamp2 != null && timestamp2 < timestamp ? timestamp2 : timestamp;
}

export function maxTimestamp(timestamp: string, timestamp2?: string | null): string {
  return timestamp2 != null && timestamp2 > timestamp ? timestamp2 : timestamp;
}

export function isTimestampInRange(
  timestamp: string,
  startAtInclusive?: string | null,
  endAtExclusive?: string | null,
): boolean {
  return (
    (startAtInclusive == null || timestamp >= startAtInclusive) &&
    (endAtExclusive == null || timestamp < endAtExclusive)
  );
}

export function getCurrentIsoDate(): string {
  return toIsoDatePart(new Date());
}

// create a string of the form 2025-01-09
export function toIsoDatePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDatePart(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

export function addWeeks(date: Date, weeks = 1): Date {
  return addDays(date, weeks * 7);
}

export function addDays(date: Date, days = 1): Date {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  if (!Number.isInteger(days)) {
    throw new Error('Days must be an integer');
  }

  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

export function dateFromTimestampString(timestamp?: string | null): Date | undefined {
  if (timestamp) {
    try {
      return new Date(timestamp);
    } catch (e) {
      console.warn(e);
    }
  }
  return undefined;
}

/**
 * Checks if an exercise plan was completed today, accounting for the user's timezone
 * @param param timestamp The timestamp to check
 * @returns boolean indicating whether the time is today
 */
export function isTimestampToday(timestamp?: string): boolean {
  // If there's no completed date, return false
  if (!timestamp) return false;

  // Get the user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Parse the completed date string to a Date object
  const completedDate = parseISO(timestamp);

  // Convert the UTC date to the user's local timezone
  const completedDateInUserTimezone = toZonedTime(completedDate, userTimezone);

  // Check if the adjusted date is today
  return isToday(completedDateInUserTimezone);
}

/**
 * Get start and end dates for a specific week
 * @param weekOffset Number of weeks offset from current week (e.g., -1 for last week, 1 for next week)
 * @param weekStartsOn First day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns Object containing the start and end dates of the specified week as ISO strings
 */
export function getWeekDateRange(
  weekOffset = 0,
  weekStartsOn: WeekStart = 0, // 0 = Sunday (default in US), 1 = Monday (default in Europe)
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const targetDate = addWeeks(now, weekOffset);

  const startDate = startOfWeek(targetDate, { weekStartsOn });
  const endDate = endOfWeek(targetDate, { weekStartsOn });

  // Make sure we're returning valid Date objects by creating new instances
  return {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  };
}

/**
 * Checks if a timestamp is from this week or before this week
 * @param timestamp ISO format timestamp to check
 * @param weekStartsOn First day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns boolean indicating whether the timestamp is from this week or earlier
 */
export function isTimestampBeforeThisWeek(timestamp?: string, weekStartsOn: WeekStart = 0): boolean {
  if (!timestamp) return false;

  const date = parseISO(timestamp);
  const { startDate } = getWeekDateRange(0, weekStartsOn);

  return date < startDate;
}

/**
 * A wrapper around regular "setTimeout" that could be awaited inside async/await block.
 * @param ms - milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
