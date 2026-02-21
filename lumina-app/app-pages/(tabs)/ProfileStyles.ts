/**
 * Styling for the Profile page
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomCheckBoxStyles } from '@/comp-lib/core/custom-checkbox-list/CustomCheckBoxStyles';
import { CustomSwitchStyles } from '@/comp-lib/core/custom-switch/CustomSwitchStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';

/**
 * Interface for base styles of the useProfileStyles hook
 */
export interface ProfileBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  scrollContent: ViewStyle;
  profileHeader: ViewStyle;
  avatarContainer: ViewStyle;
  avatarText: TextStyle;
  profileInfo: ViewStyle;
  sectionContainer: ViewStyle;
  sectionTitle: TextStyle;
  editableRow: ViewStyle;
  rowLabel: TextStyle;
  rowValue: TextStyle;
  linkRow: ViewStyle;
  linkRowContent: ViewStyle;
  linkRowText: TextStyle;
  linkRowIcon: ViewStyle;
  divider: ViewStyle;
  aboutContainer: ViewStyle;
  aboutText: TextStyle;
  creditsText: TextStyle;
  buttonContainer: ViewStyle;
  editModalOverlay: ViewStyle;
  editModalContent: ViewStyle;
  editModalTitle: TextStyle;
  editModalButtons: ViewStyle;
  gradePickerContainer: ViewStyle;
  gradeOption: ViewStyle;
  gradeOptionSelected: ViewStyle;
  gradeOptionText: TextStyle;
  gradeOptionTextSelected: TextStyle;
}

/**
 * Interface for the return value of the useProfileStyles hook
 */
export interface ProfileStyles {
  styles: ProfileBaseStyles;
  editButtonStyles: CustomButtonStyles;
  signOutButtonStyles: CustomButtonStyles;
  shareButtonStyles: CustomButtonStyles;
  checkboxStyles: CustomCheckBoxStyles;
  switchStyles: CustomSwitchStyles;
  nameInputStyles: CustomTextInputStyles;
  modalPrimaryButtonStyles: CustomButtonStyles;
  modalSecondaryButtonStyles: CustomButtonStyles;
}

/**
 * Custom hook that provides styles for the Profile component
 */
export function useProfileStyles(): ProfileStyles {
  const {
    createAppPageStyles,
    colors,
    typographyPresets,
    buttonPresets,
    spacingPresets,
    borderRadiusPresets,
    overrideStyles,
    textInputPresets,
  } = useStyleContext();

  const styles: ProfileBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      paddingHorizontal: spacingPresets.md2,
      paddingTop: spacingPresets.md2,
      paddingBottom: spacingPresets.xl,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacingPresets.lg1,
      paddingHorizontal: spacingPresets.md2,
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      marginBottom: spacingPresets.lg1,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacingPresets.md2,
    },
    avatarText: {
      ...typographyPresets.Title,
      color: colors.secondaryBackground,
      fontSize: 24,
      lineHeight: 28,
    },
    profileInfo: {
      flex: 1,
    },
    sectionContainer: {
      marginBottom: spacingPresets.lg1,
    },
    sectionTitle: {
      ...typographyPresets.Label,
      color: colors.primaryAccent,
      marginBottom: spacingPresets.md1,
      fontWeight: '600',
    },
    editableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md2,
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      marginBottom: spacingPresets.sm,
    },
    rowLabel: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    rowValue: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      fontWeight: '500',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacingPresets.md2,
      paddingHorizontal: spacingPresets.md2,
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      marginBottom: spacingPresets.sm,
    },
    linkRowContent: {
      flex: 1,
    },
    linkRowText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
    },
    linkRowIcon: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: colors.tertiaryBackground,
      marginVertical: spacingPresets.md2,
    },
    aboutContainer: {
      alignItems: 'center',
      paddingVertical: spacingPresets.lg1,
    },
    aboutText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      marginBottom: spacingPresets.xs,
    },
    creditsText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      textAlign: 'center',
    },
    buttonContainer: {
      marginTop: spacingPresets.sm,
    },
    editModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacingPresets.lg1,
    },
    editModalContent: {
      width: '100%',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.lg1,
    },
    editModalTitle: {
      ...typographyPresets.Title,
      color: colors.primaryForeground,
      marginBottom: spacingPresets.md2,
      textAlign: 'center',
    },
    editModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacingPresets.md2,
      gap: spacingPresets.md1,
    },
    gradePickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingPresets.sm,
      marginBottom: spacingPresets.md1,
    },
    gradeOption: {
      paddingVertical: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md2,
      backgroundColor: colors.tertiaryBackground,
      borderRadius: borderRadiusPresets.inputElements,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    gradeOptionSelected: {
      backgroundColor: colors.primaryAccentLight,
      borderColor: colors.primaryAccent,
    },
    gradeOptionText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    gradeOptionTextSelected: {
      color: colors.primaryAccentDark,
      fontWeight: '600',
    },
  };

  const editButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xs,
      minWidth: 0,
    },
    text: {
      color: colors.primaryAccent,
      fontSize: 14,
      lineHeight: 18,
    },
  });

  const signOutButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      width: '100%',
      marginTop: spacingPresets.md1,
    },
  });

  const shareButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
    },
  });

  const checkboxStyles: CustomCheckBoxStyles = {
    container: {
      gap: spacingPresets.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.sm,
      paddingVertical: spacingPresets.sm,
      paddingHorizontal: spacingPresets.md1,
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.inputElements,
    },
    checkboxContainer: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
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
      ...typographyPresets.Body,
      color: colors.primaryForeground,
    },
    labelSelected: {
      color: colors.primaryForeground,
      fontWeight: '500',
    },
    checkmarkIconSize: 16,
    checkmarkIconColor: colors.secondaryBackground,
  };

  const switchStyles: CustomSwitchStyles = {
    switchTrackColor: {
      false: colors.tertiaryBackground,
      true: colors.primaryAccent,
    },
    switchThumbColor: colors.secondaryBackground,
    switchIosBackgroundColor: colors.tertiaryBackground,
  };

  const nameInputStyles = overrideStyles(textInputPresets.DefaultInput, {
    container: {
      backgroundColor: colors.tertiaryBackground,
    },
    input: {
      color: colors.primaryForeground,
    },
  });

  const modalPrimaryButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      flex: 1,
    },
  });

  const modalSecondaryButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      flex: 1,
    },
  });

  return createAppPageStyles<ProfileStyles>({
    styles,
    editButtonStyles,
    signOutButtonStyles,
    shareButtonStyles,
    checkboxStyles,
    switchStyles,
    nameInputStyles,
    modalPrimaryButtonStyles,
    modalSecondaryButtonStyles,
  });
}
