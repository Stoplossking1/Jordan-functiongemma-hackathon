/**
 * Styling for the Preferences page
 */

import { TextStyle, type ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';

/** Interface for base styles of the usePreferencesStyles hook */
export interface PreferencesBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  pageTitleSection: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  contentContainer: ViewStyle;
  topicsContainer: ViewStyle;
  sectionLabel: TextStyle;
  errorText: TextStyle;
  concernsSection: ViewStyle;
  characterCount: TextStyle;
  buttonContainer: ViewStyle;
}

/** Styles for topic chip component */
export interface TopicChipStyles {
  chip: ViewStyle;
  chipSelected: ViewStyle;
  chipText: TextStyle;
  chipTextSelected: TextStyle;
}

/**
 * Interface for the return value of the usePreferencesStyles hook
 */
export interface PreferencesStyles {
  styles: PreferencesBaseStyles;
  topicChipStyles: TopicChipStyles;
  concernsInputStyles: CustomTextInputStyles;
  nextButtonStyles: CustomButtonStyles;
  headerStyles: {
    progressText: TextStyle;
  };
}

export function usePreferencesStyles(): PreferencesStyles {
  const { colors, typographyPresets, spacingPresets, buttonPresets, textInputPresets, borderRadiusPresets, overrideStyles, createAppPageStyles } =
    useStyleContext();

  const nextButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      alignSelf: 'stretch',
      marginTop: spacingPresets.md2,
    },
  });

  const concernsInputStyles: CustomTextInputStyles = overrideStyles(textInputPresets.MultilineInput, {
    container: {
      minHeight: 80,
      backgroundColor: colors.secondaryBackground,
    },
    input: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
    },
  });

  const topicChipStyles: TopicChipStyles = {
    chip: {
      paddingVertical: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md2,
      borderRadius: borderRadiusPresets.components,
      borderWidth: 2,
      borderColor: colors.primaryAccent,
      backgroundColor: colors.secondaryBackground,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipSelected: {
      backgroundColor: colors.primaryAccent,
      borderColor: colors.primaryAccent,
    },
    chipText: {
      ...typographyPresets.Label,
      color: colors.primaryAccent,
      textAlign: 'center',
    },
    chipTextSelected: {
      color: colors.secondaryBackground,
    },
  };

  const styles: PreferencesBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      paddingHorizontal: spacingPresets.lg1,
      paddingBottom: spacingPresets.lg1,
    },
    pageTitleSection: {
      flexDirection: 'column',
      gap: spacingPresets.sm,
      marginBottom: spacingPresets.lg1,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryAccent,
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'column',
      gap: spacingPresets.lg1,
    },
    topicsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingPresets.sm,
    },
    sectionLabel: {
      ...typographyPresets.Label,
      color: colors.secondaryForeground,
      marginBottom: spacingPresets.sm,
    },
    errorText: {
      ...typographyPresets.Caption,
      color: colors.customColors.error,
      marginTop: spacingPresets.xs,
    },
    concernsSection: {
      gap: spacingPresets.xs,
    },
    characterCount: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      textAlign: 'right',
    },
    buttonContainer: {
      marginTop: 'auto',
      paddingTop: spacingPresets.md2,
    },
  };

  const headerStyles = {
    progressText: {
      ...typographyPresets.Label,
      color: colors.secondaryForeground,
    },
  };

  return createAppPageStyles<PreferencesStyles>({
    styles,
    topicChipStyles,
    concernsInputStyles,
    nextButtonStyles,
    headerStyles,
  });
}
