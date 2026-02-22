import { type ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { CustomCheckBoxStyles, useCustomCheckBoxStyles } from './CustomCheckBoxStyles';
import { Ionicons } from '@expo/vector-icons';
import { useCustomCheckboxList } from './CustomCheckboxListFunc';

export interface CheckboxOption<T extends string | number> {
  value: T;
  label: string;
}

export interface CustomCheckboxListProps<T extends string | number> {
  options?: readonly CheckboxOption<T>[];
  selectedValues?: T[];
  onChange?: (newSelected: T[]) => void;
  customCheckBoxStyles?: CustomCheckBoxStyles;
}

export function CustomCheckboxList<T extends string | number>(props: CustomCheckboxListProps<T>): ReactNode {
  const defaultStyles = useCustomCheckBoxStyles();
  const styles = props.customCheckBoxStyles ?? defaultStyles;
  const { toggleValue } = useCustomCheckboxList(props);

  const isInteractive = !!props.onChange;

  return (
    <View style={styles.container}>
      {props?.options?.map((item) => {
        const isSelected = props.selectedValues?.includes(item.value);
        return (
          <TouchableOpacity
            key={item.value}
            style={styles.item}
            onPress={() => isInteractive && toggleValue(item.value)}
            disabled={!isInteractive}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!isSelected, disabled: !isInteractive }}
          >
            <View style={styles.checkboxOuter}>
              <View style={[styles.checkboxContainer, isSelected ? styles.checkboxSelected : {}]}>
                {isSelected && (
                  <Ionicons name="checkmark-sharp" size={styles.checkmarkIconSize} color={styles.checkmarkIconColor} />
                )}
              </View>
            </View>
            <CustomTextField styles={[styles.label, isSelected && styles.labelSelected]} title={item.label} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
