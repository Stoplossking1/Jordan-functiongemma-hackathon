import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { TextStyle, ViewStyle } from 'react-native';

export interface CustomRadioListStyles {
  /** Vertical stack of radio items with default "gap: spacingPresets.md1" */
  container: ViewStyle;
  /** One radio row (circle + label) with default "gap: spacingPresets.sm" */
  radioContainer: ViewStyle;
  radioCircleContainer: ViewStyle;
  radioCircle: ViewStyle;
  /** Style for the inner circle indicating selection */
  selectedCircle: ViewStyle;
  label: TextStyle;
}

export function useCustomRadioListStyles(): CustomRadioListStyles {
  const { createAppPageStyles, colors, typographyPresets, spacingPresets } = useStyleContext();

  const styles: CustomRadioListStyles = {
    container: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      gap: spacingPresets.md1,
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.sm,
    },
    radioCircleContainer: {
      width: 24,
      height: 24,
      borderRadius: 9999,
      borderWidth: 2,
      borderColor: colors.tertiaryForeground,
      backgroundColor: colors.primaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioCircle: {
      width: 16,
      height: 16,
      borderRadius: 9999,
      backgroundColor: 'transparent',
    },
    selectedCircle: {
      backgroundColor: colors.primaryAccent,
    },
    label: {
      flex: 1,
      flexShrink: 1,
      flexWrap: 'wrap',
      ...typographyPresets.Label,
      color: colors.secondaryForeground,
    },
  };

  return createAppPageStyles(styles);
}
