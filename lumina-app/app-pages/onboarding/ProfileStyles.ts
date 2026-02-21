/**
 * Styling for the Profile page
 */

import { ImageStyle, TextStyle, type ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { FormControlStyles, useFormControlStyles } from '@/comp-lib/form/FormControlStyles';

/** Interface for base styles of the useProfileStyles hook */
export interface ProfileBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  progressContainer: ViewStyle;
  progressBar: ViewStyle;
  progressFill: ViewStyle;
  progressText: TextStyle;
  illustrationContainer: ViewStyle;
  illustration: ImageStyle;
  pageTitleSection: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  contentContainer: ViewStyle;
  sectionLabel: TextStyle;
  gradeButtonsContainer: ViewStyle;
  gradeButtonsRow: ViewStyle;
  greetingPreviewContainer: ViewStyle;
  greetingPreviewText: TextStyle;
  greetingPreviewEmoji: TextStyle;
  errorText: TextStyle;
  footerContainer: ViewStyle;
}

/** Interface for grade button styles */
export interface GradeButtonStylesType {
  default: CustomButtonStyles;
  selected: CustomButtonStyles;
}

/**
 * Interface for the return value of the useProfileStyles hook
 */
export interface ProfileStyles {
  styles: ProfileBaseStyles;
  formControlStyles: FormControlStyles;
  nextButtonStyles: CustomButtonStyles;
  gradeButtonStyles: GradeButtonStylesType;
}

export function useProfileStyles(): ProfileStyles {
  const { colors, typographyPresets, spacingPresets, buttonPresets, overrideStyles, createAppPageStyles } =
    useStyleContext();

  const nextButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      alignSelf: 'stretch',
    },
  });

  const gradeButtonDefault: CustomButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      flex: 1,
      minHeight: 56,
      borderWidth: 2,
      borderColor: colors.tertiaryForeground,
      backgroundColor: colors.secondaryBackground,
    },
    text: {
      ...typographyPresets.Button,
      color: colors.secondaryForeground,
    },
  });

  const gradeButtonSelected: CustomButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      flex: 1,
      minHeight: 56,
      borderWidth: 2,
      borderColor: colors.primaryAccent,
      backgroundColor: colors.primaryAccentLight,
    },
    text: {
      ...typographyPresets.Button,
      color: colors.primaryAccent,
      fontWeight: '600',
    },
  });

  const gradeButtonStyles: GradeButtonStylesType = {
    default: gradeButtonDefault,
    selected: gradeButtonSelected,
  };

  const defaultFormControlStyles = useFormControlStyles();
  const formControlStyles = overrideStyles(defaultFormControlStyles, {
    customTextInputStyles: {
      container: {
        backgroundColor: colors.secondaryBackground,
        borderWidth: 1,
        borderColor: colors.tertiaryForeground,
      },
      focused: {
        borderColor: colors.primaryAccent,
        borderWidth: 2,
      },
    },
  });

  const styles: ProfileBaseStyles = {
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
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.sm,
      marginBottom: spacingPresets.md2,
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: colors.tertiaryBackground,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      width: '50%',
      height: '100%',
      backgroundColor: colors.primaryAccent,
      borderRadius: 3,
    },
    progressText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      minWidth: 60,
    },
    illustrationContainer: {
      alignItems: 'center',
      marginBottom: spacingPresets.md2,
    },
    illustration: {
      width: '100%',
      height: 160,
      borderRadius: 16,
    },
    pageTitleSection: {
      flexDirection: 'column',
      gap: spacingPresets.xs,
      marginBottom: spacingPresets.lg1,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryAccent,
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      lineHeight: 22,
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      alignSelf: 'stretch',
      gap: spacingPresets.lg1,
    },
    sectionLabel: {
      ...typographyPresets.Label,
      color: colors.secondaryForeground,
      marginBottom: spacingPresets.sm,
      fontWeight: '500',
    },
    gradeButtonsContainer: {
      gap: spacingPresets.md1,
    },
    gradeButtonsRow: {
      flexDirection: 'row',
      gap: spacingPresets.md1,
    },
    greetingPreviewContainer: {
      backgroundColor: colors.secondaryBackground,
      paddingVertical: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md2,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primaryAccent,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.sm,
    },
    greetingPreviewText: {
      ...typographyPresets.Body,
      color: colors.primaryAccent,
      fontStyle: 'italic',
      flex: 1,
    },
    greetingPreviewEmoji: {
      fontSize: 20,
      lineHeight: 24,
    },
    errorText: {
      ...typographyPresets.Caption,
      color: colors.customColors.error,
      marginTop: spacingPresets.xs,
    },
    footerContainer: {
      paddingTop: spacingPresets.lg1,
    },
  };

  return createAppPageStyles<ProfileStyles>({
    styles,
    formControlStyles,
    nextButtonStyles,
    gradeButtonStyles,
  });
}
