/**
 * Styling for the Index page - Welcome landing page
 */
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for value proposition item styles
 */
export interface ValuePropositionItemStyles {
  container: ViewStyle;
  iconContainer: ViewStyle;
  textContainer: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  iconSize: number;
  iconColor: string;
}

/**
 * Interface for base styles of the useIndexStyles hook
 */
export interface IndexBaseStyles {
  safeArea: ViewStyle;
  scrollView: ViewStyle;
  scrollViewContent: ViewStyle;
  container: ViewStyle;
  heroContainer: ViewStyle;
  heroImage: ImageStyle;
  contentContainer: ViewStyle;
  appName: TextStyle;
  tagline: TextStyle;
  subtitle: TextStyle;
  valuePropositionsContainer: ViewStyle;
  buttonsContainer: ViewStyle;
}

/**
 * Interface for the return value of the useIndexStyles hook
 */
export interface IndexStyles {
  styles: IndexBaseStyles;
  primaryButtonStyles: CustomButtonStyles;
  secondaryButtonStyles: CustomButtonStyles;
  valuePropositionItemStyles: ValuePropositionItemStyles;
}

/**
 * Custom hook that provides styles for the Index component
 */
export function useIndexStyles(): IndexStyles {
  const {
    createAppPageStyles,
    colors,
    typographyPresets,
    buttonPresets,
    spacingPresets,
    overrideStyles,
    borderRadiusPresets,
  } = useStyleContext();

  const styles: IndexBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: colors.primaryBackground,
    },
    heroContainer: {
      width: '100%',
      height: 220,
      overflow: 'hidden',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: spacingPresets.lg1,
      paddingTop: spacingPresets.lg1,
      paddingBottom: spacingPresets.lg2,
    },
    appName: {
      ...typographyPresets.Slogan,
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      color: colors.primaryAccent,
      textAlign: 'center',
    },
    tagline: {
      ...typographyPresets.PageTitle,
      fontSize: 22,
      lineHeight: 28,
      color: colors.primaryForeground,
      textAlign: 'center',
      marginTop: spacingPresets.xs,
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      textAlign: 'center',
      marginTop: spacingPresets.sm,
      paddingHorizontal: spacingPresets.sm,
    },
    valuePropositionsContainer: {
      marginTop: spacingPresets.lg1,
      gap: spacingPresets.md1,
    },
    buttonsContainer: {
      marginTop: spacingPresets.lg1,
      gap: spacingPresets.md1,
    },
  };

  const primaryButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
      paddingVertical: spacingPresets.md1,
      borderRadius: borderRadiusPresets.inputElements,
      backgroundColor: colors.primaryAccent,
    },
    text: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      color: colors.secondaryBackground,
    },
    pressedContainer: {
      backgroundColor: colors.primaryAccentDark,
    },
  });

  const secondaryButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      width: '100%',
      paddingVertical: spacingPresets.md1,
      borderRadius: borderRadiusPresets.inputElements,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primaryAccent,
    },
    text: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      color: colors.primaryAccent,
    },
    pressedContainer: {
      backgroundColor: colors.tertiaryBackground,
    },
  });

  const valuePropositionItemStyles: ValuePropositionItemStyles = {
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md1,
      gap: spacingPresets.md1,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryAccentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
    },
    title: {
      ...typographyPresets.Title,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    description: {
      ...typographyPresets.Body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.xxs,
    },
    iconSize: 22,
    iconColor: colors.primaryAccentDark,
  };

  return createAppPageStyles<IndexStyles>({
    styles,
    primaryButtonStyles,
    secondaryButtonStyles,
    valuePropositionItemStyles,
  });
}
