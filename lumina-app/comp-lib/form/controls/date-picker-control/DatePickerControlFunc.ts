import { useState } from 'react';
import { FormControlProps } from '../../FormControl';
import { getLocale } from '@/i18n/formatters';

type DateFormat = {
  year: 'numeric';
  month: 'long';
  day: 'numeric';
};

type TimeFormat = {
  hour: '2-digit';
  minute: '2-digit';
  hour12: boolean;
};

export type DateType = 'date' | 'time';

const DATE_FORMAT: DateFormat = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const TIME_FORMAT: TimeFormat = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

function formatDisplayValue(date: Date | undefined, dateType: DateType, locale?: string): string {
  if (!date) return '';
  return dateType === 'time'
    ? date.toLocaleTimeString(locale, TIME_FORMAT)
    : date.toLocaleDateString(locale, DATE_FORMAT);
}

export function parseTimeString(timeString?: string): Date | undefined {
  if (!timeString) return undefined;
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function parseDateString(dateString?: string): Date | undefined {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function handleDateTimeConversion(date: Date | undefined, isTimeOnly: boolean, toUTC: boolean): Date | undefined {
  if (!date) return undefined;

  const newDate = new Date();

  if (isTimeOnly) {
    // For time, just preserve hours and minutes
    newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    return newDate;
  }

  // For dates, handle UTC conversion
  if (toUTC) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getDateConstraints(props: FormControlProps): { min?: Date; max?: Date } {
  const isTimeOnly = props.dataType === 'time';

  const DEFAULTS = {
    dateMin: '1900-01-01',
    dateMax: '2100-12-31',
    timeMin: '00:00',
    timeMax: '23:59',
  };

  return {
    min: isTimeOnly
      ? parseTimeString((props.min as string | undefined) ?? DEFAULTS.timeMin)
      : handleDateTimeConversion(parseDateString((props.min as string | undefined) ?? DEFAULTS.dateMin), false, false),
    max: isTimeOnly
      ? parseTimeString((props.max as string | undefined) ?? DEFAULTS.timeMax)
      : handleDateTimeConversion(parseDateString((props.max as string | undefined) ?? DEFAULTS.dateMax), false, false),
  };
}

export interface DatePickerControlFunc {
  valueDate: Date | undefined;
  displayValue: string;
  isDatePickerVisible: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  locale?: string;
  handleConfirm: (selectedDate: Date) => void;
  handleCancel: () => void;
  toggleDatePicker: () => void;
}

export function useDatePickerControl(props: FormControlProps): DatePickerControlFunc {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const isTimeOnly = props.dataType === 'time';
  const locale = getLocale();

  const valueAsDate =
    typeof props.value !== 'string'
      ? props.value
      : isTimeOnly
        ? parseTimeString(props.value)
        : parseDateString(props.value);

  const valueDate = handleDateTimeConversion(valueAsDate as Date | undefined, isTimeOnly, false);

  const displayValue = formatDisplayValue(valueDate, props.dataType as DateType, locale);
  const { min: minimumDate, max: maximumDate } = getDateConstraints(props);

  function handleConfirm(selectedDate: Date) {
    setDatePickerVisibility(false);
    const convertedDate = handleDateTimeConversion(selectedDate, isTimeOnly, true);
    props.onValueChange(convertedDate);
  }

  function handleCancel() {
    setDatePickerVisibility(false);
  }

  function toggleDatePicker() {
    setDatePickerVisibility((prev) => !prev);
  }

  return {
    valueDate,
    displayValue,
    isDatePickerVisible,
    minimumDate,
    maximumDate,
    locale,
    toggleDatePicker,
    handleConfirm,
    handleCancel,
  };
}
