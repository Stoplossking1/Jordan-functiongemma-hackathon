import React, { type ReactNode } from 'react';
import Slider from '@react-native-community/slider';
import { FormControlProps } from '../../FormControl';
import { useSliderControlStyles } from './SliderControlStyles';
import { View } from 'react-native';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import {
  getDefaultStepDecimals,
  getStepDecimals,
  getTicksMaxSliderValue,
  getTicksMinSliderValue,
  isIntegerDataType,
  normalizeSliderStep,
} from '../../utils';
import { useSliderControl } from './SliderControlFunc';

export function SliderControl(props: FormControlProps): ReactNode {
  const defaultStyles = useSliderControlStyles();
  const styles = props.styles?.sliderControlStyles ?? defaultStyles;
  const { handleSliderChange } = useSliderControl(props);
  const minimumValue = typeof props?.min === 'number' ? props?.min : getTicksMinSliderValue(props?.ticks);
  const maximumValue = typeof props?.max === 'number' ? props?.max : getTicksMaxSliderValue(props?.ticks);

  const isInteger = isIntegerDataType(props.dataType, props.steps);
  const floatDisplayValue = Number(props.value).toFixed(
    getStepDecimals(props.steps) ?? getDefaultStepDecimals(minimumValue, maximumValue),
  );

  const displayValue = props.value != null ? (isInteger ? props.value.toString() : floatDisplayValue) : '';

  return (
    <View>
      {props.SliderValueComponent ? (
        <props.SliderValueComponent value={(props.value as number) ?? undefined} />
      ) : (
        <View style={styles.valueContainer}>
          <CustomTextField title={displayValue} styles={styles.valueText} />
          {props?.unitShort && displayValue !== '' && (
            <CustomTextField title={` ${props?.unitShort}`} styles={styles.valueText} />
          )}
        </View>
      )}
      <Slider
        step={normalizeSliderStep(props.dataType, props.steps)}
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        tapToSeek
        value={props.value as number}
        onValueChange={handleSliderChange}
        minimumTrackTintColor={styles.minimumTrackTintColor}
        maximumTrackTintColor={styles.maximumTrackTintColor}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {props.SliderMinLabelComponent ? (
          <props.SliderMinLabelComponent value={minimumValue} />
        ) : (
          <CustomTextField title={minimumValue.toString()} styles={styles.labelText} />
        )}
        {props.SliderMaxLabelComponent ? (
          <props.SliderMaxLabelComponent value={maximumValue} />
        ) : (
          <CustomTextField title={maximumValue.toString()} styles={styles.labelText} />
        )}
      </View>
    </View>
  );
}
