/**
 * Styling for the Home page
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for recent problem item styles
 */
export interface RecentProblemItemStyles {
  container: ViewStyle;
  pressable: ViewStyle;
  content: ViewStyle;
  metaRow: ViewStyle;
  title: TextStyle;
  meta: TextStyle;
  category: TextStyle;
  chevron: ViewStyle;
}

/**
 * Interface for base styles of the useHomeStyles hook
 */
export interface HomeBaseStyles {
  safeArea: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  container: ViewStyle;
  greetingSection: ViewStyle;
  greeting: TextStyle;
  greetingName: TextStyle;
  streakContainer: ViewStyle;
  streakIconContainer: ViewStyle;
  streakText: TextStyle;
  streakCount: TextStyle;
  heroSection: ViewStyle;
  cameraButtonPressable: ViewStyle;
  cameraButtonPressableDisabled: ViewStyle;
  cameraButtonOuter: ViewStyle;
  cameraButtonInner: ViewStyle;
  cameraIconContainer: ViewStyle;
  cameraLoadingContainer: ViewStyle;
  cameraButtonLabel: TextStyle;
  cameraErrorText: TextStyle;
  statsCard: ViewStyle;
  statsNumber: TextStyle;
  statsLabel: TextStyle;
  recentSection: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  recentList: ViewStyle;
  emptyText: TextStyle;
  chatHistoryContainer: ViewStyle;
}

/**
 * Interface for the return value of the useHomeStyles hook
 */
export interface HomeStyles {
  styles: HomeBaseStyles;
  cameraButtonStyles: CustomButtonStyles;
  chatHistoryButtonStyles: CustomButtonStyles;
  recentProblemItemStyles: RecentProblemItemStyles;
}

/**
 * Custom hook that provides styles for the Home component
 */
export function useHomeStyles(): HomeStyles {
  const {
    createAppPageStyles,
    colors,
    typographyPresets,
    buttonPresets,
    spacingPresets,
    borderRadiusPresets,
    overrideStyles,
  } = useStyleContext();

  const styles: HomeBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: spacingPresets.lg2,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      paddingHorizontal: spacingPresets.md2,
      backgroundColor: colors.primaryBackground,
    },
    greetingSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacingPresets.md2,
    },
    greeting: {
      ...typographyPresets.Title,
      color: colors.secondaryForeground,
    },
    greetingName: {
      ...typographyPresets.Title,
      color: colors.primaryAccent,
      fontWeight: '700',
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.customColors.warning,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xs,
      borderRadius: borderRadiusPresets.components,
    },
    streakIconContainer: {
      marginRight: spacingPresets.xs,
    },
    streakText: {
      ...typographyPresets.Label,
      color: colors.secondaryBackground,
      fontWeight: '600',
    },
    streakCount: {
      ...typographyPresets.Label,
      color: colors.secondaryBackground,
      fontWeight: '700',
    },
    heroSection: {
      alignItems: 'center',
      marginTop: spacingPresets.xl,
      marginBottom: spacingPresets.lg2,
    },
    cameraButtonPressable: {
      borderRadius: 9999,
    },
    cameraButtonPressableDisabled: {
      opacity: 0.75,
    },
    cameraButtonOuter: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.primaryAccentLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraButtonInner: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryAccent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraIconContainer: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraLoadingContainer: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraButtonLabel: {
      ...typographyPresets.Button,
      color: colors.primaryAccent,
      fontWeight: '600',
      marginTop: spacingPresets.md1,
      textAlign: 'center',
    },
    cameraErrorText: {
      ...typographyPresets.Caption,
      color: colors.customColors.error,
      textAlign: 'center',
      marginTop: spacingPresets.xs,
    },
    statsCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md2,
      alignItems: 'center',
      marginBottom: spacingPresets.lg1,
    },
    statsNumber: {
      ...typographyPresets.PageTitle,
      color: colors.primaryAccent,
      fontWeight: '700',
    },
    statsLabel: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.xs,
    },
    recentSection: {
      flex: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacingPresets.md1,
    },
    sectionTitle: {
      ...typographyPresets.Subtitle,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    recentList: {
      gap: spacingPresets.sm,
    },
    emptyText: {
      ...typographyPresets.Body,
      color: colors.tertiaryForeground,
      textAlign: 'center',
      marginTop: spacingPresets.md2,
    },
    chatHistoryContainer: {
      marginTop: spacingPresets.lg1,
    },
  };

  const cameraButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryAccent,
    },
    pressedContainer: {
      backgroundColor: colors.primaryAccentDark,
    },
    icon: {
      size: 48,
      color: colors.secondaryBackground,
    },
    pressedIcon: {
      color: colors.secondaryBackground,
    },
  });

  const chatHistoryButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      borderColor: colors.primaryAccent,
      borderWidth: 1,
    },
    text: {
      color: colors.primaryAccent,
    },
    icon: {
      size: 20,
      color: colors.primaryAccent,
    },
  });

  const recentProblemItemStyles: RecentProblemItemStyles = {
    container: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      overflow: 'hidden',
    },
    pressable: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacingPresets.md1,
    },
    content: {
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.xs,
    },
    title: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      fontWeight: '500',
    },
    meta: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      marginTop: spacingPresets.xxs,
    },
    category: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
      fontWeight: '500',
    },
    chevron: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
  };

  return createAppPageStyles<HomeStyles>({
    styles,
    cameraButtonStyles,
    chatHistoryButtonStyles,
    recentProblemItemStyles,
  });
}
