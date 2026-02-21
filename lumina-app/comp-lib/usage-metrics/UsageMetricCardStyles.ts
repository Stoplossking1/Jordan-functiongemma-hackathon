import { ViewStyle, TextStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '../core/custom-button/CustomButtonStyles';

export interface UsageMetricCardStyles {
  container: ViewStyle;
  headerRow: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  actionItem: CustomButtonStyles;
  progressBar: ViewStyle;
}

export function useUsageMetricCardStyles(): UsageMetricCardStyles {
  const {
    colors,
    spacingPresets,
    borderRadiusPresets,
    typographyPresets,
    buttonPresets,
    overrideStyles,
    createAppPageStyles,
  } = useStyleContext();

  const styles: UsageMetricCardStyles = {
    container: {
      backgroundColor: colors.primaryAccentDark,
      borderRadius: borderRadiusPresets.components * 2,
      padding: spacingPresets.lg1,
      margin: spacingPresets.sm,
      width: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacingPresets.md1,
    },
    title: {
      ...typographyPresets.Title,
      color: colors.secondaryBackground,
    },
    description: {
      ...typographyPresets.Body,
      color: colors.secondaryBackground,
      marginTop: spacingPresets.xs,
      marginBottom: spacingPresets.sm,
    },
    actionItem: overrideStyles(buttonPresets.Primary, {}),
    progressBar: {
      marginTop: spacingPresets.md1,
    },
  };

  return createAppPageStyles<UsageMetricCardStyles>(styles);
}
