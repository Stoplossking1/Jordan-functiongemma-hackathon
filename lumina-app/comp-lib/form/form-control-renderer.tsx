import { ReactNode } from 'react';

import { DatePickerControl } from './controls/date-picker-control/DatePickerControl';
import { SliderControl } from './controls/slider-control/SliderControl';
import { FormControlProps } from './FormControl';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import { textInputPropsForDataType } from './utils';
import { CustomRadioList } from '../core/custom-radio-list/CustomRadioList';
import { CustomCheckboxList } from '../core/custom-checkbox-list/CustomCheckboxList';
import { CustomSwitch } from '../core/custom-switch/CustomSwitch';

export function formControlRenderer(props: FormControlProps): ReactNode {
  switch (props.type) {
    case 'textInput': {
      return (
        <CustomTextInput
          value={props.value?.toString() ?? ''}
          onChangeText={props.onValueChange}
          styles={
            (props.multiline ? props.styles.customTextInputMultilineStyles : props.styles.customTextInputStyles) ?? {}
          }
          placeholder={props.placeholder}
          showErrorStyle={!!props.showTextInputErrorStyle}
          editable={!props.disabled}
          multiline={props.multiline}
          cursivePlaceholder={props.cursivePlaceholder}
          {...textInputPropsForDataType(props.dataType)}
        />
      );
    }
    case 'datePicker': {
      return <DatePickerControl {...props} />;
    }
    case 'radio':
    case 'select': {
      return (
        <CustomRadioList
          options={props.options}
          value={props.value as string | undefined}
          onChange={props.onValueChange}
          customRadioListStyles={props.styles?.customRadioListStyles}
        />
      );
    }
    case 'toggle': {
      return <CustomSwitch value={!!props.value} onValueChange={props.onValueChange} />;
    }
    case 'checkbox':
    case 'multiSelect': {
      return (
        <CustomCheckboxList
          options={props.options}
          selectedValues={props.value as string[] | undefined}
          onChange={props.onValueChange}
          customCheckBoxStyles={props.styles?.customCheckBoxStyles}
        />
      );
    }
    case 'slider': {
      return <SliderControl {...props} />;
    }
    default:
      console.warn(`Unknown control type: ${props.type}`);
      return null;
  }
}
