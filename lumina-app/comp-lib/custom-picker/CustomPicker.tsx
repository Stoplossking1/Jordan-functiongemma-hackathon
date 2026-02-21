import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import RNPickerSelect, { type Item } from 'react-native-picker-select';
import { CustomPickerCoreStyles } from './CustomPickerStyles';

/**
 * A customizable picker component that uses react-native-picker-select
 * and Feather icons for a consistent UI.
 * Styles must be of type CustomPickerCoreStyles and need to be customized by getting
 * the styles from  the useCustomPickerCoreStyles hook and using the overrideStyles function to customize them.
 */

export interface CustomPickerProps {
  onValueChange: (value: any, index: number) => void;
  items: Item[];
  placeholder?: Item;
  selectedValue?: any;
  styles: CustomPickerCoreStyles;
  iconColor?: string;
}

export function CustomPicker(props: CustomPickerProps): ReactNode {
  const { styles, pickerStyles } = props.styles;
  return (
    <View style={styles.container}>
      <RNPickerSelect
        Icon={() => (
          <Feather name={'chevron-down'} size={20} color={props.iconColor ?? '#666'} style={styles.iconStyle} />
        )}
        onValueChange={props.onValueChange}
        value={props.selectedValue}
        placeholder={props.placeholder}
        style={pickerStyles}
        useNativeAndroidPickerStyle={false}
        items={props.items}
      />
    </View>
  );
}
