/**
 * Styling for the Assistant page - AI Math Tutor Chat Interface
 */

import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import {
  ChatInputFooterBaseStyles,
  useChatInputFooterStyles,
} from '@/comp-lib/chat/input-footer/ChatInputFooterStyles';
import { CustomHeaderStyles, useCustomHeaderStyles } from '@/comp-lib/custom-header/CustomHeaderStyles';
import { ChatMessageRendererStyles, useChatMessageRendererStyles } from '@/comp-lib/chat/message-renderer/ChatMessageRendererStyles';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/** Interface for base styles of the useAssistantStyles hook */
export interface AssistantBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  keyboardAvoidingView: ViewStyle;
  subContainer: ViewStyle;
  chatList: ViewStyle;
  problemImageContainer: ViewStyle;
  problemImage: ImageStyle;
  problemImageLabel: TextStyle;
  quickActionsContainer: ViewStyle;
  solutionStepContainer: ViewStyle;
  stepNumberBadge: ViewStyle;
  stepNumberText: TextStyle;
  stepContent: ViewStyle;
  stepText: TextStyle;
  celebrationContainer: ViewStyle;
  celebrationText: TextStyle;
  tutorAvatarContainer: ViewStyle;
  tutorAvatarText: TextStyle;
}

/** Styles for quick action chip buttons */
export interface QuickActionChipStyles {
  chipButton: CustomButtonStyles;
}

/**
 * Interface for the return value of the useAssistantStyles hook
 */
export interface AssistantStyles {
  styles: AssistantBaseStyles;
  customTextInputStyles: CustomTextInputStyles;
  chatInputFooterBaseStyles: ChatInputFooterBaseStyles;
  customHeaderStyles: CustomHeaderStyles;
  chatMessageRendererStyles: ChatMessageRendererStyles;
  quickActionChipStyles: QuickActionChipStyles;
}

export function useAssistantStyles(multiline: boolean): AssistantStyles {
  const { createAppPageStyles, overrideStyles, colors, spacingPresets, typographyPresets, buttonPresets, borderRadiusPresets } = useStyleContext();

  const styles: AssistantBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      justifyContent: 'space-between',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      paddingHorizontal: spacingPresets.md2,
    },
    chatList: {
      flexGrow: 1,
      paddingTop: spacingPresets.sm,
      paddingBottom: spacingPresets.sm,
      justifyContent: 'flex-end',
    },
    problemImageContainer: {
      marginBottom: spacingPresets.md1,
      padding: spacingPresets.md1,
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      alignItems: 'center',
    },
    problemImage: {
      width: '100%',
      height: 120,
      borderRadius: borderRadiusPresets.inputElements,
      resizeMode: 'contain',
    },
    problemImageLabel: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      marginTop: spacingPresets.xs,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingPresets.sm,
      paddingHorizontal: spacingPresets.md2,
      paddingVertical: spacingPresets.sm,
    },
    solutionStepContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacingPresets.sm,
      paddingLeft: spacingPresets.xs,
    },
    stepNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryAccent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacingPresets.sm,
    },
    stepNumberText: {
      ...typographyPresets.Caption,
      color: colors.primaryAccentForeground,
      fontWeight: '600',
      fontSize: 12,
      lineHeight: 16,
    },
    stepContent: {
      flex: 1,
    },
    stepText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
    },
    celebrationContainer: {
      backgroundColor: colors.primaryAccentLight,
      paddingHorizontal: spacingPresets.md1,
      paddingVertical: spacingPresets.sm,
      borderRadius: borderRadiusPresets.components,
      marginTop: spacingPresets.sm,
      alignSelf: 'flex-start',
    },
    celebrationText: {
      ...typographyPresets.Label,
      color: colors.primaryAccent,
      fontWeight: '600',
    },
    tutorAvatarContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tutorAvatarText: {
      ...typographyPresets.Label,
      color: colors.primaryAccentForeground,
      fontWeight: '600',
      fontSize: 14,
      lineHeight: 18,
    },
  };

  const { styles: defaultChatInputFooterBaseStyles, customTextInputStyles: defaultCustomTextInputStyles } =
    useChatInputFooterStyles(multiline);

  const chatInputFooterBaseStyles = overrideStyles(defaultChatInputFooterBaseStyles, {
    container: {
      backgroundColor: colors.secondaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.tertiaryBackground,
    },
  });

  const customTextInputStyles = overrideStyles(defaultCustomTextInputStyles, {
    container: {
      backgroundColor: colors.primaryBackground,
      borderColor: colors.tertiaryBackground,
    },
    input: {
      color: colors.primaryForeground,
    },
    placeholderTextColor: colors.tertiaryForeground,
  });

  const defaultHeaderStyles = useCustomHeaderStyles();
  const customHeaderStyles = overrideStyles(defaultHeaderStyles, {
    container: {
      backgroundColor: colors.primaryBackground,
      paddingVertical: spacingPresets.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.tertiaryBackground,
    },
    title: {
      ...typographyPresets.Title,
      color: colors.primaryAccent,
      fontWeight: '600',
    },
    backCustomButtonStyles: overrideStyles(buttonPresets.Tertiary, {
      iconOnlyContainer: {
        marginLeft: -4,
        height: '100%',
        width: '100%',
        borderRadius: 0,
        justifyContent: 'flex-start',
      },
      text: {
        fontSize: spacingPresets.lg1,
        color: colors.primaryAccent,
      },
    }),
  });

  const defaultChatMessageRendererStyles = useChatMessageRendererStyles();
  const chatMessageRendererStyles = overrideStyles(defaultChatMessageRendererStyles, {
    leftBubble: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      borderBottomLeftRadius: spacingPresets.xs,
    },
    rightBubble: {
      backgroundColor: colors.primaryAccent,
      borderRadius: borderRadiusPresets.components,
      borderBottomRightRadius: spacingPresets.xs,
    },
    leftBubbleText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
    },
    rightBubbleText: {
      ...typographyPresets.Body,
      color: colors.primaryAccentForeground,
    },
    avatarLeft: {
      backgroundColor: colors.primaryAccent,
    },
    avatarLeftText: {
      color: colors.primaryAccentForeground,
      fontWeight: '600',
    },
  });

  const quickActionChipStyles: QuickActionChipStyles = {
    chipButton: overrideStyles(buttonPresets.Secondary, {
      container: {
        paddingHorizontal: spacingPresets.md1,
        paddingVertical: spacingPresets.sm,
        borderRadius: borderRadiusPresets.components,
        borderWidth: 1,
        borderColor: colors.primaryAccent,
        backgroundColor: 'transparent',
        minWidth: undefined,
      },
      text: {
        ...typographyPresets.Caption,
        color: colors.primaryAccent,
        fontWeight: '500',
      },
    }),
  };

  return createAppPageStyles<AssistantStyles>({
    styles,
    customTextInputStyles,
    chatInputFooterBaseStyles,
    customHeaderStyles,
    chatMessageRendererStyles,
    quickActionChipStyles,
  });
}
