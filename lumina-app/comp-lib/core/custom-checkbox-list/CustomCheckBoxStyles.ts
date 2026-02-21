import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { TextStyle, ViewStyle } from 'react-native';

export interface CustomCheckBoxStyles {
  /** Vertical stack of checkbox items with default "gap: spacingPresets.md1" */
  container: ViewStyle;
  /** One checkbox row (checkbox + label) with default "gap: spacingPresets.sm" */
  item: ViewStyle;
  checkboxOuter?: ViewStyle;
  checkboxContainer: ViewStyle;
  checkboxSelected: ViewStyle;
  label: TextStyle;
  labelSelected: TextStyle;
  checkmarkIconSize?: number;
  checkmarkIconColor?: string;
}

export function useCustomCheckBoxStyles(): CustomCheckBoxStyles {
  const { createAppPageStyles, colors, typographyPresets, spacingPresets, borderRadiusPresets } = useStyleContext();

  const checkmarkIconSize = 18;
  const checkmarkIconColor = colors.primaryBackground;

  const styles: CustomCheckBoxStyles = {
    container: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      gap: spacingPresets.md1,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacingPresets.sm,
    },
    checkboxOuter: {},
    checkboxContainer: {
      width: 24,
      height: 24,
      borderRadius: borderRadiusPresets.components,
      borderWidth: 1,
      borderColor: colors.tertiaryForeground,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    checkboxSelected: {
      backgroundColor: colors.primaryAccent,
      borderColor: colors.primaryAccent,
    },
    label: {
      flex: 1,
      flexShrink: 1,
      flexWrap: 'wrap',
      ...typographyPresets.Label,
      color: colors.secondaryForeground,
    },
    labelSelected: {},
    checkmarkIconSize: checkmarkIconSize,
    checkmarkIconColor: checkmarkIconColor,
  };

  return createAppPageStyles<CustomCheckBoxStyles>(styles);
}
