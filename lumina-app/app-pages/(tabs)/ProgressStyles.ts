/**
 * Styling for the Progress page
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for base styles of the useProgressStyles hook
 */
export interface ProgressBaseStyles {
  safeArea: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  container: ViewStyle;
  headerSection: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  stateCard: ViewStyle;
  stateTitle: TextStyle;
  stateDescription: TextStyle;
  stateActionContainer: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  statsGrid: ViewStyle;
  statCard: ViewStyle;
  statTitle: TextStyle;
  statValue: TextStyle;
  statHelperText: TextStyle;
  summaryCard: ViewStyle;
  summaryTitle: TextStyle;
  summaryValue: TextStyle;
  summaryDetails: TextStyle;
  actionSection: ViewStyle;
}

/**
 * Interface for the return value of the useProgressStyles hook
 */
export interface ProgressStyles {
  styles: ProgressBaseStyles;
  primaryActionButtonStyles: CustomButtonStyles;
  secondaryActionButtonStyles: CustomButtonStyles;
}

/**
 * Custom hook that provides styles for the Progress component
 */
export function useProgressStyles(): ProgressStyles {
  const { createAppPageStyles, colors, typographyPresets, buttonPresets, spacingPresets, borderRadiusPresets, overrideStyles } =
    useStyleContext();

  const styles: ProgressBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacingPresets.md2,
      paddingTop: spacingPresets.md2,
      paddingBottom: spacingPresets.lg2,
    },
    container: {
      flex: 1,
    },
    headerSection: {
      marginBottom: spacingPresets.md2,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryForeground,
      marginBottom: spacingPresets.xs,
    },
    description: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    stateCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      paddingVertical: spacingPresets.md2,
      paddingHorizontal: spacingPresets.md2,
      alignItems: 'flex-start',
      marginBottom: spacingPresets.md2,
      gap: spacingPresets.xs,
    },
    stateTitle: {
      ...typographyPresets.Subtitle,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    stateDescription: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    stateActionContainer: {
      marginTop: spacingPresets.xs,
      width: '100%',
    },
    section: {
      marginBottom: spacingPresets.md2,
      gap: spacingPresets.sm,
    },
    sectionTitle: {
      ...typographyPresets.Subtitle,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingPresets.sm,
    },
    statCard: {
      flexGrow: 1,
      flexBasis: '47%',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      paddingVertical: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md1,
      gap: spacingPresets.xxs,
    },
    statTitle: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
    },
    statValue: {
      ...typographyPresets.Title,
      color: colors.primaryAccent,
      fontWeight: '700',
    },
    statHelperText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
    },
    summaryCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      paddingVertical: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md1,
      gap: spacingPresets.xxs,
    },
    summaryTitle: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
    },
    summaryValue: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    summaryDetails: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
    },
    actionSection: {
      marginTop: spacingPresets.sm,
    },
  };

  const primaryActionButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
    },
  });

  const secondaryActionButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      width: '100%',
    },
  });

  return createAppPageStyles<ProgressStyles>({
    styles,
    primaryActionButtonStyles,
    secondaryActionButtonStyles,
  });
}
