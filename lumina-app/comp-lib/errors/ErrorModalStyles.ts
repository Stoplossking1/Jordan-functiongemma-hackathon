import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

import { useResponsiveDesign } from '../styles/useResponsiveDesign';

export interface ErrorModalBaseStyles {
  container: ViewStyle;
  safeArea: ViewStyle;
  content: ViewStyle;
  contentWeb: ViewStyle;
  iconContainer: ViewStyle;
  icon: TextStyle;
  wizardImage: ImageStyle;
  titleStyle: TextStyle;
  subtitleStyle: TextStyle;
  projectIdContainer: ViewStyle;
  projectIdStyle: TextStyle;
  buttonContainer: ViewStyle;
  devContainer: ViewStyle;
  devTitle: TextStyle;
  devText: TextStyle;
  devErrorText: TextStyle;
  sectionHeader: ViewStyle;
  sectionHeaderText: TextStyle;
  codeBlock: ViewStyle;
  codeLine: TextStyle;
}

export interface ErrorModalStyles {
  styles: ErrorModalBaseStyles;
  tryAgainButtonStyle: CustomButtonStyles;
  reportButtonStyle: CustomButtonStyles;
  moreInfoButtonStyle: CustomButtonStyles;
  isPhone: boolean;
  isPlatformWeb: boolean;
  isPlatformNative: boolean;
  wrapperProps: { edges: string[] };
}

export function useErrorModalStyles(): ErrorModalStyles {
  const { colors, typographyPresets, spacingPresets, borderRadiusPresets, overrideStyles, buttonPresets } =
    useStyleContext();

  const { isPhone, isPlatformWeb, isPlatformNative } = useResponsiveDesign();

  const wrapperProps = { edges: ['top', 'left', 'right', 'bottom'] };

  const styles: ErrorModalBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacingPresets.md2,
    },
    contentWeb: {
      maxHeight: 600,
      height: '100%',
      maxWidth: 500,
    },
    content: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacingPresets.lg2,
      paddingVertical: spacingPresets.lg2,
      shadowColor: colors.primaryForeground,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    iconContainer: {
      marginBottom: spacingPresets.lg2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: colors.customColors.error,
    },
    wizardImage: {
      width: 80,
      height: 80,
    },
    titleStyle: {
      ...typographyPresets.PageTitle,
      color: colors.primaryForeground,
      textAlign: 'center',
      marginBottom: spacingPresets.md1,
    },
    subtitleStyle: {
      ...typographyPresets.Label,
      fontWeight: 400,
      textAlign: 'center',
      color: colors.customColors.gray[600],
    },
    projectIdContainer: {
      padding: spacingPresets.md1,
      minWidth: 200,
    },
    projectIdStyle: {
      ...typographyPresets.Body,
      color: colors.customColors.tertiary,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'column',
      marginTop: spacingPresets.lg1,
      alignSelf: 'stretch',
    },
    devContainer: {
      padding: spacingPresets.md2,
      borderRadius: borderRadiusPresets.components,
      alignSelf: 'stretch',
    },
    devTitle: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      fontWeight: '700',
      marginBottom: spacingPresets.sm,
    },
    devText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 20,
    },
    devErrorText: {
      ...typographyPresets.Body,
      color: colors.customColors.error,
      fontFamily: 'monospace',
      fontWeight: '600',
      fontSize: 14,
      lineHeight: 22,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacingPresets.xs,
    },
    sectionHeaderText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    codeBlock: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.sm,
      marginBottom: spacingPresets.md1,
    },
    codeLine: {
      ...typographyPresets.Caption,
      fontFamily: 'monospace',
      color: colors.customColors.technicalInfoText,
      fontSize: 12,
      lineHeight: 18,
    },
  };

  const tryAgainButtonStyle = overrideStyles(buttonPresets.Primary, {
    container: {
      minWidth: 140,
      marginHorizontal: spacingPresets.sm,
      marginBottom: spacingPresets.md1,
      paddingVertical: spacingPresets.md1,
      backgroundColor: colors.customColors.wozCTA,
    },
    text: {
      fontWeight: '600',
    },
    activityIndicator: {
      size: 'small',
    },
  });

  const reportButtonStyle = overrideStyles(buttonPresets.Secondary, {
    container: {
      minWidth: 140,
      marginHorizontal: spacingPresets.sm,
      borderColor: colors.secondaryForeground,
      borderRadius: 8,
      paddingVertical: spacingPresets.md1,
      backgroundColor: 'transparent',
    },
    text: {
      color: colors.secondaryForeground,
      fontWeight: '600',
      fontSize: 16,
    },
    activityIndicator: {
      size: 'small',
      color: colors.secondaryForeground,
    },
  });

  const moreInfoButtonStyle = overrideStyles(buttonPresets.Tertiary, {
    text: {
      fontWeight: '600',
      fontSize: 16,
      color: colors.customColors.wozCTA,
    },
  });

  return {
    styles,
    tryAgainButtonStyle,
    reportButtonStyle,
    isPhone,
    isPlatformWeb,
    isPlatformNative,
    wrapperProps,
    moreInfoButtonStyle,
  };
}
