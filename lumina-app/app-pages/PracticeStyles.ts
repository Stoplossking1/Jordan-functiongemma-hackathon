/**
 * Styling for Practice screen
 */

import { type TextStyle, type ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useCustomHeaderStyles, type CustomHeaderStyles } from '@/comp-lib/custom-header/CustomHeaderStyles';
import { type CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

export interface PracticeBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  loadingContainer: ViewStyle;
  generatingContainer: ViewStyle;
  generatingText: TextStyle;
  generatingSubtext: TextStyle;
  welcomeSection: ViewStyle;
  welcomeTitle: TextStyle;
  welcomeSubtitle: TextStyle;
  statsCard: ViewStyle;
  statsRow: ViewStyle;
  statItem: ViewStyle;
  statValue: TextStyle;
  statLabel: TextStyle;
  mistakeSummarySection: ViewStyle;
  sectionTitle: TextStyle;
  sectionSubtitle: TextStyle;
  mistakeCard: ViewStyle;
  mistakeTopicRow: ViewStyle;
  mistakeTopicLabel: TextStyle;
  mistakeCount: TextStyle;
  mistakeCategory: TextStyle;
  topicFilterSection: ViewStyle;
  topicChipsScrollView: ViewStyle;
  topicChipsContainer: ViewStyle;
  topicChip: ViewStyle;
  topicChipSelected: ViewStyle;
  topicChipText: TextStyle;
  topicChipTextSelected: TextStyle;
  problemCard: ViewStyle;
  problemHeader: ViewStyle;
  problemTopicBadge: ViewStyle;
  problemTopicText: TextStyle;
  problemDifficultyBadge: ViewStyle;
  problemDifficultyText: TextStyle;
  problemSourceBadge: ViewStyle;
  problemSourceText: TextStyle;
  problemText: TextStyle;
  hintContainer: ViewStyle;
  hintLabel: TextStyle;
  hintText: TextStyle;
  answerSection: ViewStyle;
  answerInputContainer: ViewStyle;
  answerInput: TextStyle;
  solutionSection: ViewStyle;
  solutionHeader: ViewStyle;
  solutionLabel: TextStyle;
  correctBadge: ViewStyle;
  incorrectBadge: ViewStyle;
  resultBadgeText: TextStyle;
  solutionText: TextStyle;
  solutionStepsContainer: ViewStyle;
  solutionStepRow: ViewStyle;
  solutionStepNumber: ViewStyle;
  solutionStepNumberText: TextStyle;
  solutionStepText: TextStyle;
  buttonContainer: ViewStyle;
  emptyStateContainer: ViewStyle;
  emptyStateText: TextStyle;
}

export interface TopicChipStyles {
  container: ViewStyle;
  containerSelected: ViewStyle;
  text: TextStyle;
  textSelected: TextStyle;
}

export interface PracticeStyles {
  styles: PracticeBaseStyles;
  customHeaderStyles: CustomHeaderStyles;
  primaryButtonStyles: CustomButtonStyles;
  secondaryButtonStyles: CustomButtonStyles;
  hintButtonStyles: CustomButtonStyles;
  topicChipStyles: TopicChipStyles;
}

export function usePracticeStyles(): PracticeStyles {
  const { colors, typographyPresets, spacingPresets, buttonPresets, overrideStyles, borderRadiusPresets } = useStyleContext();
  const defaultHeaderStyles = useCustomHeaderStyles();

  const styles: PracticeBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacingPresets.md2,
      paddingBottom: spacingPresets.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    generatingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacingPresets.xl,
    },
    generatingText: {
      ...typographyPresets.Title,
      color: colors.primaryAccent,
      marginTop: spacingPresets.md2,
    },
    generatingSubtext: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.xs,
      textAlign: 'center',
    },
    welcomeSection: {
      paddingTop: spacingPresets.lg1,
      paddingBottom: spacingPresets.md2,
    },
    welcomeTitle: {
      ...typographyPresets.PageTitle,
      color: colors.primaryForeground,
      marginBottom: spacingPresets.xs,
    },
    welcomeSubtitle: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    statsCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md2,
      marginBottom: spacingPresets.md2,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...typographyPresets.PageTitle,
      color: colors.primaryAccent,
      fontWeight: '700',
    },
    statLabel: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.xxs,
    },
    mistakeSummarySection: {
      marginBottom: spacingPresets.md2,
    },
    sectionTitle: {
      ...typographyPresets.Title,
      color: colors.primaryForeground,
      marginBottom: spacingPresets.xs,
    },
    sectionSubtitle: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
      marginBottom: spacingPresets.sm,
    },
    mistakeCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.sm,
      marginBottom: spacingPresets.xs,
      borderLeftWidth: 4,
      borderLeftColor: colors.primaryAccent,
    },
    mistakeTopicRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mistakeTopicLabel: {
      ...typographyPresets.Label,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    mistakeCount: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
      fontWeight: '700',
    },
    mistakeCategory: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.xxs,
    },
    topicFilterSection: {
      marginBottom: spacingPresets.md2,
    },
    topicChipsScrollView: {
      flexGrow: 0,
    },
    topicChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingPresets.xs,
    },
    topicChip: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 20,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xs,
      borderWidth: 1,
      borderColor: colors.tertiaryBackground,
    },
    topicChipSelected: {
      backgroundColor: colors.primaryAccent,
      borderColor: colors.primaryAccent,
    },
    topicChipText: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
    },
    topicChipTextSelected: {
      ...typographyPresets.Caption,
      color: colors.primaryAccentForeground,
    },
    problemCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md2,
      marginBottom: spacingPresets.md2,
    },
    problemHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingPresets.xs,
      marginBottom: spacingPresets.md2,
    },
    problemTopicBadge: {
      backgroundColor: colors.primaryAccentLight,
      borderRadius: borderRadiusPresets.components,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xxs,
    },
    problemTopicText: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
      fontWeight: '600',
    },
    problemDifficultyBadge: {
      backgroundColor: colors.tertiaryBackground,
      borderRadius: borderRadiusPresets.components,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xxs,
    },
    problemDifficultyText: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
    },
    problemSourceBadge: {
      backgroundColor: colors.primaryAccentDark,
      borderRadius: borderRadiusPresets.components,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xxs,
    },
    problemSourceText: {
      ...typographyPresets.Caption,
      color: colors.primaryAccentForeground,
      fontWeight: '500',
    },
    problemText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      lineHeight: 28,
    },
    hintContainer: {
      backgroundColor: colors.tertiaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.sm,
      marginTop: spacingPresets.md2,
    },
    hintLabel: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
      fontWeight: '600',
      marginBottom: spacingPresets.xxs,
    },
    hintText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    answerSection: {
      marginBottom: spacingPresets.md2,
    },
    answerInputContainer: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.inputElements,
      borderWidth: 2,
      borderColor: colors.primaryAccent,
      padding: spacingPresets.sm,
    },
    answerInput: {
      ...typographyPresets.Input,
      color: colors.primaryForeground,
      minHeight: 48,
    },
    solutionSection: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md2,
      marginBottom: spacingPresets.md2,
    },
    solutionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacingPresets.sm,
    },
    solutionLabel: {
      ...typographyPresets.Subtitle,
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    correctBadge: {
      backgroundColor: '#22c55e',
      borderRadius: borderRadiusPresets.components,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xxs,
    },
    incorrectBadge: {
      backgroundColor: '#ef4444',
      borderRadius: borderRadiusPresets.components,
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xxs,
    },
    resultBadgeText: {
      ...typographyPresets.Caption,
      color: '#ffffff',
    },
    solutionText: {
      ...typographyPresets.Body,
      color: colors.primaryAccent,
      fontWeight: '600',
      marginBottom: spacingPresets.sm,
    },
    solutionStepsContainer: {
      marginTop: spacingPresets.sm,
    },
    solutionStepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacingPresets.xs,
    },
    solutionStepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryAccentLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacingPresets.xs,
    },
    solutionStepNumberText: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
      fontWeight: '700',
    },
    solutionStepText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      flex: 1,
    },
    buttonContainer: {
      gap: spacingPresets.sm,
      paddingTop: spacingPresets.sm,
    },
    emptyStateContainer: {
      alignItems: 'center',
      paddingVertical: spacingPresets.xl,
    },
    emptyStateText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      textAlign: 'center',
    },
  };

  const customHeaderStyles = overrideStyles(defaultHeaderStyles, {
    container: {
      backgroundColor: colors.primaryBackground,
    },
  });

  const primaryButtonStyles = buttonPresets.Primary;
  const secondaryButtonStyles = buttonPresets.Secondary;
  const hintButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      borderWidth: 1,
      borderColor: colors.primaryAccent,
    },
  });

  const topicChipStyles: TopicChipStyles = {
    container: styles.topicChip,
    containerSelected: styles.topicChipSelected,
    text: styles.topicChipText,
    textSelected: styles.topicChipTextSelected,
  };

  return {
    styles,
    customHeaderStyles,
    primaryButtonStyles,
    secondaryButtonStyles,
    hintButtonStyles,
    topicChipStyles,
  };
}
