/**
 * Login styles for Lumina - warm, friendly design optimized for low-end devices
 */
import { AuthBaseStyles, LoginCoreStyles } from '@/comp-lib/auth/LoginCoreStyles';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

export interface LoginStyles {
  /**
   * Shared auth styles used across Login, Signup, and Reset Password screens
   */
  sharedAuthStyles: AuthBaseStyles;
  sharedTextInputStyles: CustomTextInputStyles;
  sharedPrimaryButtonStyles: CustomButtonStyles;
  sharedTertiaryButtonStyles: CustomButtonStyles;
  loginCoreStyles: LoginCoreStyles;
}
export function useLoginStyles(): LoginStyles {
  const {
    createAppPageStyles,
    colors,
    typographyPresets,
    textInputPresets,
    spacingPresets,
    buttonPresets,
    overrideStyles,
  } = useStyleContext();

  const authBaseStyles: AuthBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacingPresets.lg1,
      backgroundColor: colors.primaryBackground,
    },
    subContainer: {
      flexGrow: 1,
      gap: spacingPresets.md2,
    },
    topSection: {
      flex: 1,
      // NOTE: adjust "topSection" top padding if needed to make space for the content
      paddingTop: spacingPresets.lg2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingPresets.sm,
    },
    iconWrapper: {
      marginBottom: spacingPresets.md2,
    },
    icon: {
      size: 48,
      color: colors.primaryAccent,
    },
    appName: {
      ...typographyPresets.Slogan,
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      color: colors.primaryAccent,
      marginBottom: spacingPresets.sm,
    },
    title: {
      ...typographyPresets.PageTitle,
      fontSize: 24,
      lineHeight: 32,
      color: colors.primaryForeground,
      marginBottom: spacingPresets.xs,
      textAlign: 'center',
    },
    subTitle: {
      ...typographyPresets.Subtitle,
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryForeground,
      textAlign: 'center',
      marginBottom: spacingPresets.md1,
    },
    middleSection: {
      flex: 1.5,
      alignSelf: 'stretch',
      justifyContent: 'flex-start',
      paddingTop: spacingPresets.md2,
      gap: spacingPresets.md1,
    },
    bottomSection: {
      minHeight: '25%',
      justifyContent: 'flex-start',
      gap: spacingPresets.md1,
      marginBottom: spacingPresets.lg1,
    },
    bottomSectionKeyboard: {
      flexGrow: 0,
      flexShrink: 0,
      marginBottom: spacingPresets.md2,
    },
  };

  const textInputStyles: CustomTextInputStyles = overrideStyles(textInputPresets.DefaultInput, {
    wrapper: {
      marginBottom: spacingPresets.sm,
    },
    container: {
      minHeight: 56,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.tertiaryForeground,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: spacingPresets.md2,
    },
    focused: {
      borderColor: colors.primaryAccent,
      borderWidth: 2,
    },
    input: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.primaryForeground,
    },
    label: {
      ...typographyPresets.Label,
      fontSize: 14,
      lineHeight: 20,
      color: colors.secondaryForeground,
      marginBottom: spacingPresets.xs,
    },
    errorText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.customColors.error,
      marginTop: spacingPresets.xs,
    },
    iconRightSize: 24,
    iconRightColor: colors.secondaryForeground,
    placeholderTextColor: colors.tertiaryForeground,
  });

  const primaryButtonStyles: CustomButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      alignSelf: 'stretch',
      minHeight: 56,
      borderRadius: 12,
      backgroundColor: colors.primaryAccent,
    },
    pressedContainer: {
      backgroundColor: colors.primaryAccentDark,
    },
    text: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      color: colors.secondaryBackground,
    },
    disabledContainer: {
      backgroundColor: colors.tertiaryForeground,
      opacity: 0.6,
    },
  });

  const tertiaryButtonStyles: CustomButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      alignSelf: 'stretch',
      minHeight: 48,
    },
    text: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500',
      color: colors.primaryAccent,
    },
    pressedText: {
      color: colors.primaryAccentDark,
    },
  });

  const resetPasswordButtonStyles: CustomButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      alignSelf: 'center',
      marginTop: spacingPresets.sm,
    },
    text: {
      ...typographyPresets.Caption,
      fontSize: 14,
      lineHeight: 20,
      color: colors.secondaryForeground,
    },
    pressedText: {
      color: colors.primaryAccent,
    },
  });

  return {
    sharedAuthStyles: authBaseStyles,
    sharedTextInputStyles: textInputStyles,
    sharedPrimaryButtonStyles: primaryButtonStyles,
    sharedTertiaryButtonStyles: tertiaryButtonStyles,
    /**
     * NOTE: repeating styles in the loginCoreStyles because we need "createAppPageStyles" for the page styles for app responsive size/style changes
     */
    ...createAppPageStyles<
      Omit<
        LoginStyles,
        'sharedAuthStyles' | 'sharedTextInputStyles' | 'sharedPrimaryButtonStyles' | 'sharedTertiaryButtonStyles'
      >
    >({
      loginCoreStyles: {
        authBaseStyles,
        textInputStyles,
        primaryButtonStyles,
        tertiaryButtonStyles,
        resetPasswordButtonStyles,
      },
    }),
  };
}
