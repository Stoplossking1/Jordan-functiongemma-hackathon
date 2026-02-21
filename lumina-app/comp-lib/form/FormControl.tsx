import React, { ReactNode } from 'react';

import type { FormControlType } from '@shared/schema-types';
import { FormControlStyles } from './FormControlStyles';
import { formControlRenderer } from './form-control-renderer';

export type FormControlValue = string | number | boolean | Date | string[];

/**
 * Interface for form control components configurations
 */
export interface FormControlConfig {
  /**
   * Path to the data in the form model (e.g., '/profile/firstName')
   */
  data: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  /**
   * Available options for slider ticks with labels
   */
  ticks?: { label: string; value: number }[];
  /**
   * Increment/decrement step for slider controls
   */
  steps?: number;
  type: FormControlType;
  /**
   * Type of data handled by the control (e.g., 'string', 'number', 'date', 'weight')
   */
  dataType: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  required?: boolean;
  unit?: string;
  unitShort?: string;
  /**
   * Internal description of the control's purpose
   */
  description?: string;

  // VALIDATION
  validationPattern?: string;
  validationPatternMessage?: string;
  /** Minimum length for string values */
  minLength?: number;
  /** Maximum length for string values */
  maxLength?: number;
  /** Minimum value for numbers or date strings */
  min?: number | string;
  /** Maximum value for numbers or date strings */
  max?: number | string;
  /** Minimum number of items for array values */
  minItems?: number;
  /** Maximum number of items for array values */
  maxItems?: number;
}

export interface FormControlProps extends FormControlConfig {
  value?: FormControlValue;
  onValueChange: (val?: FormControlValue) => void;
  showTextInputErrorStyle?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  /**
   * Custom styles to apply depends on type of Control
   */
  styles: FormControlStyles;
  /**
   * If provided will replace a generic component for display value on top of slider
   */
  SliderValueComponent?: React.ComponentType<{ value?: number }>;
  /**
   * If provided will replace a generic component for display minimum value on left bottom of slider
   */
  SliderMinLabelComponent?: React.ComponentType<{ value?: number }>;
  /**
   * If provided will replace a generic component for display maximum value on right bottom of slider
   */
  SliderMaxLabelComponent?: React.ComponentType<{ value?: number }>;
  cursivePlaceholder?: boolean;
}

export function FormControl(props: FormControlProps): ReactNode {
  return formControlRenderer(props);
}
