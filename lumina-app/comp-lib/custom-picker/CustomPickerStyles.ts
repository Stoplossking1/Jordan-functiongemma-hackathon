import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { TextStyle, ViewStyle } from 'react-native';
import { PickerStyle } from 'react-native-picker-select';

/** interface for the base styles directly used on the component */
export interface CustomPickerCoreBaseStyles {
  container: ViewStyle;
  iconStyle: TextStyle;
}

/**
 * Interface for the return value of the useCustomPickerStyles hook
 * The component that integrates CustomPicker will need to use this interface as a base for its styles.
 * It needs to be extended by using overrideStyles function from StyleContext and passing the styles from useCustomPickerCoreStyles hook.
 * This allows for customization of the picker styles while maintaining the core styles.
 */
export interface CustomPickerCoreStyles {
  styles: CustomPickerCoreBaseStyles;
  pickerStyles: PickerStyle;
}
export function useCustomPickerCoreStyles(): CustomPickerCoreStyles {
  const { colors, spacingPresets, borderRadiusPresets, typographyPresets } = useStyleContext();

  const pickerStyles: PickerStyle = {
    placeholder: {
      color: colors.tertiaryForeground,
    },
    inputIOSContainer: {
      pointerEvents: 'none',
    },
    inputIOS: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      ...typographyPresets.Input,
      padding: 10,
    },
    inputAndroid: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: 16,
      paddingVertical: spacingPresets.md2,
      color: colors.primaryForeground,
      opacity: 1,
    },
  };
  const styles: CustomPickerCoreBaseStyles = {
    container: {
      borderWidth: 1,
      borderColor: colors.secondaryForeground,
      borderRadius: borderRadiusPresets.inputElements,
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    iconStyle: {
      marginTop: 10,
      marginRight: 5,
    },
  };

  return { styles, pickerStyles };
}
