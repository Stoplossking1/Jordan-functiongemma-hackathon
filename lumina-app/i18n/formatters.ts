/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * If you need to make changes, put up a PR to modify the source code in the i18n directory of the builder
 */

import { formatDistance, formatRelative, Locale } from 'date-fns';
import * as Localization from 'expo-localization';
import { enUS, de } from 'date-fns/locale';
import { i18n } from './index.ts';

// Map of locales
const locales: Record<string, Locale> = {
  en: enUS,
  de: de,
  // Add more locales as needed
};

// Get the current locale
export function getLocale(): string {
  return i18n.language ?? Localization.getLocales()[0]?.languageCode ?? 'en-US';
}

// Get the current locale
function getDateLocale(): Locale {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en-US';
  return locale && locales[locale] ? locales[locale] : enUS;
}

// Number formatter
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(), options).format(value);
}

// Currency formatter
export function formatCurrency(
  value: number,
  currencyCode = 'USD',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: currencyCode,
    ...options,
  }).format(value);
}

// Date formatter
export function formatDate(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}

// Time formatter
export function formatTime(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(getLocale(), {
    hour: 'numeric',
    minute: 'numeric',
    ...options,
  }).format(dateObj);
}

// Percentage formatter
export function formatPercent(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'percent',
    ...options,
  }).format(value / 100);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date The date to format
 * @param baseDate The date to compare with (defaults to now)
 */
function relativeTime(date: Date | number, baseDate?: Date): string {
  return formatDistance(date, baseDate ?? new Date(), {
    locale: getDateLocale(),
    addSuffix: true,
  });
}

/**
 * Format relative calendar time (e.g., "today", "yesterday", "next Monday")
 */
function relativeCalendar(date: Date | number, baseDate?: Date): string {
  return formatRelative(date, baseDate ?? new Date(), {
    locale: getDateLocale(),
  });
}

// Day abbreviation formatter
// Example: formatDayAbbreviation(new Date('2024-03-20')) => "Wed"
function formatDayAbbreviation(date: Date | number | string, letterNum = 3): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const locale = getLocale();

  // Get the short day name based on locale
  const shortDay = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(dateObj);
  return shortDay.slice(0, letterNum);
}

// Week title formatter
// Example: formatWeekTitle(new Date('2024-03-18'), new Date('2024-03-24')) => "Week: 3/18 (Mo) - 3/24 (Su)"
function formatWeekTitle(startDate: Date | number | string, endDate: Date | number | string): string {
  // Create fresh copies to avoid mutating the original dates
  const startOriginal =
    typeof startDate === 'string' || typeof startDate === 'number'
      ? new Date(startDate)
      : new Date(startDate.getTime());
  const endOriginal =
    typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : new Date(endDate.getTime());
  const today = new Date();

  // Create copies for comparison with time set to beginning/end of day
  const startDay = new Date(startOriginal.getTime());
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(endOriginal.getTime());
  endDay.setHours(23, 59, 59, 999);

  // Check if today is between start and end dates (current week)
  if (today >= startDay && today <= endDay) {
    return i18n.t('date.thisWeek');
  }

  // Format the title for all other weeks
  const locale = getLocale();
  const startMonth = new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).format(startOriginal);
  const endMonth = new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).format(endOriginal);
  const startDayAbbr = formatDayAbbreviation(startOriginal, 2);
  const endDayAbbr = formatDayAbbreviation(endOriginal, 1);

  return `${i18n.t('date.week')}: ${startMonth} (${startDayAbbr}) - ${endMonth} (${endDayAbbr})`;
}

// Export all formatters
export const formatters = {
  number: formatNumber,
  currency: formatCurrency,
  date: formatDate,
  time: formatTime,
  percent: formatPercent,
  relativeTime,
  relativeCalendar,
  formatDayAbbreviation,
  formatWeekTitle,
};
