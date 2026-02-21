/**
 * Styling for the Chat History page
 */

import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import type { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { CustomHeaderStyles, useCustomHeaderStyles } from '@/comp-lib/custom-header/CustomHeaderStyles';

/** Interface for base styles of the useChatStyles hook */
export interface ChatBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  contentContainer: ViewStyle;
  searchContainer: ViewStyle;
  listContainer: ViewStyle;
  listContentContainer: ViewStyle;
  feedbackStateContainer: ViewStyle;
  feedbackTitle: TextStyle;
  feedbackSubtitle: TextStyle;
}

/** Interface for conversation list item styles */
export interface ConversationItemStyles {
  container: ViewStyle;
  pressable: ViewStyle;
  pressableDisabled: ViewStyle;
  thumbnailContainer: ViewStyle;
  thumbnail: ImageStyle;
  thumbnailPlaceholder: ViewStyle;
  thumbnailPlaceholderText: TextStyle;
  thumbnailIconWrapper: ViewStyle;
  contentContainer: ViewStyle;
  topRow: ViewStyle;
  topicTag: ViewStyle;
  topicTagText: TextStyle;
  dateText: TextStyle;
  previewText: TextStyle;
  bottomRow: ViewStyle;
  statusContainer: ViewStyle;
  statusIconWrapper: ViewStyle;
  statusText: TextStyle;
  solvedStatusText: TextStyle;
  inProgressStatusText: TextStyle;
  deleteButton: ViewStyle;
  deleteButtonDisabled: ViewStyle;
  deleteIconWrapper: ViewStyle;
  deleteIconColor: TextStyle;
}

/** Interface for empty state styles */
export interface EmptyStateStyles {
  container: ViewStyle;
  iconContainer: ViewStyle;
  iconWrapper: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
}

/**
 * Interface for the return value of the useChatStyles hook
 */
export interface ChatStyles {
  styles: ChatBaseStyles;
  headerStyles: CustomHeaderStyles;
  searchInputStyles: CustomTextInputStyles;
  retryButtonStyles: CustomButtonStyles;
  conversationItemStyles: ConversationItemStyles;
  emptyStateStyles: EmptyStateStyles;
}

export function useChatStyles(): ChatStyles {
  const {
    createAppPageStyles,
    overrideStyles,
    colors,
    spacingPresets,
    typographyPresets,
    borderRadiusPresets,
    buttonPresets,
  } =
    useStyleContext();

  const styles: ChatBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    contentContainer: {
      flex: 1,
    },
    searchContainer: {
      paddingHorizontal: spacingPresets.md2,
      paddingVertical: spacingPresets.sm,
    },
    listContainer: {
      flex: 1,
    },
    listContentContainer: {
      paddingHorizontal: spacingPresets.md2,
      paddingBottom: spacingPresets.lg1,
    },
    feedbackStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacingPresets.lg2,
      gap: spacingPresets.sm,
    },
    feedbackTitle: {
      ...typographyPresets.Subtitle,
      color: colors.primaryForeground,
      textAlign: 'center',
      fontWeight: '600',
    },
    feedbackSubtitle: {
      ...typographyPresets.Body,
      color: colors.tertiaryForeground,
      textAlign: 'center',
    },
  };

  const defaultHeaderStyles = useCustomHeaderStyles();
  const headerStyles = overrideStyles(defaultHeaderStyles, {
    container: {
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: spacingPresets.md2,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryAccent,
    },
  });

  const searchInputStyles: CustomTextInputStyles = {
    container: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.inputElements,
      borderWidth: 1,
      borderColor: colors.tertiaryBackground,
      paddingHorizontal: spacingPresets.md1,
      height: 44,
    },
    input: {
      ...typographyPresets.Input,
      color: colors.primaryForeground,
    },
    placeholderTextColor: colors.tertiaryForeground,
    iconLeftSize: 20,
    iconLeftColor: colors.tertiaryForeground,
    iconLeftContainer: {
      marginRight: spacingPresets.sm,
    },
  };

  const retryButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      marginTop: spacingPresets.xs,
      minWidth: 120,
    },
  });

  const conversationItemStyles: ConversationItemStyles = {
    container: {
      marginBottom: spacingPresets.md1,
    },
    pressable: {
      flexDirection: 'row',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md1,
      alignItems: 'center',
    },
    pressableDisabled: {
      opacity: 0.6,
    },
    thumbnailContainer: {
      width: 56,
      height: 56,
      marginRight: spacingPresets.md1,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: borderRadiusPresets.components,
    },
    thumbnailPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: borderRadiusPresets.components,
      backgroundColor: colors.primaryAccent + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnailPlaceholderText: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
    },
    thumbnailIconWrapper: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacingPresets.xs,
    },
    topicTag: {
      backgroundColor: colors.primaryAccent + '20',
      paddingHorizontal: spacingPresets.sm,
      paddingVertical: spacingPresets.xxs,
      borderRadius: borderRadiusPresets.inputElements,
    },
    topicTagText: {
      ...typographyPresets.Caption,
      color: colors.primaryAccent,
      fontWeight: '600',
    },
    dateText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
    },
    previewText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      marginBottom: spacingPresets.sm,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIconWrapper: {
      width: 14,
      height: 14,
      marginRight: spacingPresets.xs,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
    },
    solvedStatusText: {
      ...typographyPresets.Caption,
      color: colors.customColors.success,
      fontWeight: '600',
    },
    inProgressStatusText: {
      ...typographyPresets.Caption,
      color: colors.customColors.warning,
      fontWeight: '600',
    },
    deleteButton: {
      padding: spacingPresets.xs,
    },
    deleteButtonDisabled: {
      opacity: 0.5,
    },
    deleteIconWrapper: {
      width: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteIconColor: {
      color: colors.customColors.error,
    },
  };

  const emptyStateStyles: EmptyStateStyles = {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacingPresets.lg2,
    },
    iconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primaryAccent + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacingPresets.lg1,
    },
    iconWrapper: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      ...typographyPresets.Title,
      color: colors.primaryForeground,
      textAlign: 'center',
      marginBottom: spacingPresets.sm,
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.tertiaryForeground,
      textAlign: 'center',
    },
  };

  return createAppPageStyles<ChatStyles>({
    styles,
    headerStyles,
    searchInputStyles,
    retryButtonStyles,
    conversationItemStyles,
    emptyStateStyles,
  });
}
