import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomCheckBoxStyles, useCustomCheckBoxStyles } from '../core/custom-checkbox-list/CustomCheckBoxStyles';
import { CustomRadioListStyles, useCustomRadioListStyles } from '../core/custom-radio-list/CustomRadioListStyles';
import { CustomSwitchStyles, useCustomSwitchStyles } from '../core/custom-switch/CustomSwitchStyles';
import { CustomTextInputStyles } from '../core/custom-text-input/CustomTextInputStyles';
import { SliderControlStyles, useSliderControlStyles } from './controls/slider-control/SliderControlStyles';
import { DatePickerControlStyles } from './controls/date-picker-control/DatePickerControlStyles';

export interface FormControlStyles {
  customTextInputStyles?: CustomTextInputStyles; // for type textInput
  customTextInputMultilineStyles?: CustomTextInputStyles; // for type textInput multiline
  sliderControlStyles?: SliderControlStyles; // for type slider
  customRadioListStyles?: CustomRadioListStyles; // for type radio and select
  customCheckBoxStyles?: CustomCheckBoxStyles; // for type checkbox and multiSelect
  customSwitchStyles?: CustomSwitchStyles; // for type toggle
  datePickerControlStyles?: DatePickerControlStyles; // for type datePicker
}

export function useFormControlStyles(): FormControlStyles {
  const { overrideStyles, textInputPresets } = useStyleContext();

  const customTextInputStyles = overrideStyles(textInputPresets.DefaultInput, {});
  const customTextInputMultilineStyles = overrideStyles(textInputPresets.MultilineInput, {});

  const defaultSliderControlStyles = useSliderControlStyles();
  const sliderControlStyles = overrideStyles(defaultSliderControlStyles, {});

  const defaultRadioListStyles = useCustomRadioListStyles();
  const customRadioListStyles = overrideStyles(defaultRadioListStyles, {});

  const defaultCheckBoxStyles = useCustomCheckBoxStyles();
  const customCheckBoxStyles = overrideStyles(defaultCheckBoxStyles, {});

  const defaultSwitchStyles = useCustomSwitchStyles();
  const customSwitchStyles = overrideStyles(defaultSwitchStyles, {});

  return {
    customTextInputStyles,
    customTextInputMultilineStyles,
    sliderControlStyles,
    customRadioListStyles,
    customCheckBoxStyles,
    customSwitchStyles,
  };
}
