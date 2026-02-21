import { type ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { CustomRadioListStyles, useCustomRadioListStyles } from './CustomRadioListStyles';
import { CustomTextField } from '../custom-text-field/CustomTextField';

export interface RadioOption<T extends string | number> {
  value: T;
  label: string;
}

export interface CustomRadioListProps<T extends string | number> {
  options?: readonly RadioOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  customRadioListStyles?: CustomRadioListStyles;
}

export function CustomRadioList<T extends string | number>(props: CustomRadioListProps<T>): ReactNode {
  const defaultStyles = useCustomRadioListStyles();
  const styles = props.customRadioListStyles ?? defaultStyles;

  return (
    <View style={styles.container}>
      {props?.options?.map((option) => {
        const selected = props.value === option.value;
        return (
          <TouchableOpacity
            onPress={() => props.onChange(option.value)}
            style={styles.radioContainer}
            key={option.value}
          >
            <View style={styles.radioCircleContainer}>
              <View style={[styles.radioCircle, selected && styles.selectedCircle]} />
            </View>
            <CustomTextField title={option.label} styles={styles.label} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
