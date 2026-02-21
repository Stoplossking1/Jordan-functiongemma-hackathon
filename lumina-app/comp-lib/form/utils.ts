import { Platform, TextInputProps } from 'react-native';
import { FormControlConfig, FormControlValue } from './FormControl';
import { parseTimeString, parseDateString } from './controls/date-picker-control/DatePickerControlFunc';

const NUMERIC_DATA_TYPES = ['int'];
const FLOAT_DATA_TYPES = ['float'];
const FLOAT_OR_NUMERIC_DATA_TYPES = ['distance', 'weight', 'temperature', 'speed', 'duration', 'volume', 'currency'];

export function getStepDecimals(configSteps?: number): number | undefined {
  if (configSteps == null) {
    return 0;
  }
  const str = configSteps.toString();
  const i = str.indexOf('.');
  return i === -1 ? 0 : str.length - i - 1;
}

/**
 * Determines the number of decimal places to use for the slider
 * when no explicit `step` value is provided.
 *
 * - Returns 2 for small ranges (e.g. 0–1) → display as 0.00
 * - Returns 0 for larger ranges → display as whole numbers
 */
export function getDefaultStepDecimals(minValue: number, maxValue: number): number {
  const isSmallRange = Math.abs(maxValue - minValue) === 1;
  return isSmallRange ? 2 : 0;
}

export function isIntegerDataType(configDataType: string, configSteps?: number): boolean {
  if (FLOAT_OR_NUMERIC_DATA_TYPES.includes(configDataType)) {
    return getStepDecimals(configSteps) === 0;
  }
  return NUMERIC_DATA_TYPES.includes(configDataType);
}

export function isFloatDataType(configDataType: string, configSteps?: number): boolean {
  if (FLOAT_OR_NUMERIC_DATA_TYPES.includes(configDataType)) {
    return getStepDecimals(configSteps) !== 0;
  }
  return FLOAT_DATA_TYPES.includes(configDataType);
}

export function normalizeSliderStep(configDataType: string, configSteps?: number): number | undefined {
  if (isIntegerDataType(configDataType, configSteps)) {
    if (!configSteps) return 1;
    return Number.isInteger(configSteps) ? configSteps : Math.ceil(Math.abs(configSteps));
  }
  return configSteps;
}

export function formatValueByStep(value: number, configDataType: string, configSteps?: number): number {
  const decimals = getStepDecimals(configSteps);
  if (decimals == null) {
    return value;
  }
  return Number(Number(value).toFixed(decimals));
}

export function validateControl(control: FormControlConfig, value?: FormControlValue): string | undefined {
  if (
    control.required &&
    (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))
  ) {
    return `Required`;
  }

  if (control.validationPattern && typeof value === 'string') {
    const regex = new RegExp(control.validationPattern);
    if (!regex.test(value)) {
      return control.validationPatternMessage ?? `Invalid format`;
    }
  }

  if (typeof value === 'string') {
    if (control.minLength && value.length < control.minLength) {
      return `Must be at least ${control.minLength} characters.`;
    }
    if (control.maxLength && value.length > control.maxLength) {
      return `Must be at most ${control.maxLength} characters.`;
    }
    if (control.dataType === 'imageUrl') {
      try {
        new URL(value);
      } catch {
        return `Must be a valid URL`;
      }
    }
  }

  if (
    value &&
    control.dataType &&
    (isIntegerDataType(control.dataType) || isFloatDataType(control.dataType, control.steps))
  ) {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numberValue)) {
      return 'Invalid number';
    }

    if (isIntegerDataType(control.dataType, control.steps) && !Number.isInteger(numberValue)) {
      return 'Invalid number';
    } else if (isFloatDataType(control.dataType, control.steps) && !Number.isFinite(numberValue)) {
      return 'Invalid number';
    }
  }

  if (typeof value === 'number') {
    if (control?.min && typeof control.min === 'number' && value < control.min) {
      return `Must be at least ${control.min}`;
    }
    if (control?.max && typeof control.max === 'number' && value > control.max) {
      return `Must be at most ${control.max}`;
    }
  }

  if (control.dataType === 'date' && typeof value === 'string') {
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      return 'Invalid date format';
    }
    const minDate = control?.min ? new Date(control.min) : undefined;
    const minDateDisplayText = minDate?.toLocaleDateString();
    const maxDate = control?.max ? new Date(control.max) : undefined;
    const maxDateDisplayText = maxDate?.toLocaleDateString();
    if (minDate && dateValue < minDate) {
      return `Date cannot be before ${minDateDisplayText}`;
    }
    if (maxDate && dateValue > maxDate) {
      return `Date cannot be after ${maxDateDisplayText}`;
    }
  }

  if (Array.isArray(value)) {
    if (control.minItems && value.length < control.minItems) {
      return `Select at least ${control.minItems} item(s)`;
    }
    if (control.maxItems && value.length > control.maxItems) {
      return `Select no more than ${control.maxItems} item(s)`;
    }
  }

  return undefined;
}

export function getTicksMinSliderValue(ticks?: { label: string; value: number }[]): number {
  return ticks?.length ? ticks[0].value : 0;
}

export function getTicksMaxSliderValue(ticks?: { label: string; value: number }[]): number {
  return ticks?.length ? ticks[ticks.length - 1].value : 1;
}

export function textInputPropsForDataType(dataType?: string): Partial<TextInputProps> {
  switch (dataType) {
    case 'int':
    case 'duration':
    case 'volume':
    case 'currency':
      return {
        keyboardType: 'numeric',
        inputMode: 'numeric',
        autoCorrect: false,
      };
    case 'float':
    case 'distance':
    case 'weight':
    case 'temperature':
    case 'speed':
      return {
        keyboardType: Platform.OS === 'ios' ? 'decimal-pad' : 'numeric',
        inputMode: 'decimal',
        autoCorrect: false,
      };
    case 'phone':
      return {
        keyboardType: 'phone-pad',
        inputMode: 'tel',
        maxLength: 20,
      };
    case 'email':
      return {
        keyboardType: 'email-address',
        inputMode: 'email',
        autoCapitalize: 'none',
        autoCorrect: false,
        textContentType: 'emailAddress',
        autoComplete: 'email',
        importantForAutofill: 'yes',
      };
    case 'string':
    default:
      return {
        keyboardType: 'default',
      };
  }
}

export function buildInitialFormState(controls: FormControlConfig[]): Record<string, FormControlValue | undefined> {
  const initialState: Record<string, FormControlValue | undefined> = {};

  controls.forEach((control) => {
    if (control.type === 'toggle') {
      initialState[control.data] = control.defaultValue ?? false; // toggle can't be undefined as it always has a value
    } else if (control.type === 'datePicker') {
      const isTimeOnly = control.dataType === 'time';
      const dv = control.defaultValue as string | Date | undefined;

      let defaultDate: Date | undefined;

      if (dv == null) {
        defaultDate = undefined;
      } else if (dv instanceof Date) {
        // handles Date object that set by llm (e.g., https://github.com/WithWoz/AppCore/commit/050b51006dd72ce52caf182f44d65151378c3fec)
        defaultDate = new Date(dv);
      } else if (isTimeOnly) {
        // 'HH:mm:ss' or 'HH:mm'
        defaultDate = parseTimeString(dv.length === 5 ? `${dv}:00` : dv);
      } else {
        // 'YYYY-MM-DD'
        defaultDate = parseDateString(dv);
      }

      initialState[control.data] = defaultDate;
    } else {
      initialState[control.data] = control.defaultValue;
    }
  });

  return initialState;
}
