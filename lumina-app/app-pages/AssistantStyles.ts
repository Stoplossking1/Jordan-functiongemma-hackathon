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
  problemVoiceContainer: ViewStyle;
  problemVoiceIcon: ViewStyle;
  problemVoiceLabel: TextStyle;
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
  messageRow: ViewStyle;
  userBubble: ViewStyle;
  userBubbleText: TextStyle;
  aiBubble: ViewStyle;
  aiBubbleText: TextStyle;
}

/** Styles for quick action chip buttons */
export interface QuickActionChipStyles {
  chipButton: CustomButtonStyles;
}

/** Styles for LaTeX message rendering */
export interface LatexMessageStyles {
  textColor: string;
  fontSize: number;
}

/** Styles for media action buttons */
export interface MediaActionStyles {
  container: ViewStyle;
  actionButton: ViewStyle;
}

/**
 * Interface for the return value of the useAssistantStyles hook
 */
export interface AssistantStyles {
  styles: AssistantBaseStyles;
  customTextInputStyles: CustomTextInputStyles;
  chatInputFooterBaseStyles: ChatInputFooterBaseStyles;
  customHeaderStyles: CustomHeaderStyles;
  quickActionChipStyles: QuickActionChipStyles;
  latexMessageStyles: LatexMessageStyles;
  mediaActionStyles: MediaActionStyles;
  newChatButtonStyles: CustomButtonStyles;
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
    problemVoiceContainer: {
      marginBottom: spacingPresets.md1,
      padding: spacingPresets.md1,
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.md1,
    },
    problemVoiceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryAccentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    problemVoiceLabel: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
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
    messageRow: {
      flexDirection: 'row',
      marginVertical: spacingPresets.sm,
      maxWidth: '85%',
      gap: spacingPresets.sm,
    },
    userBubble: {
      backgroundColor: colors.primaryAccent,
      borderRadius: borderRadiusPresets.components,
      borderBottomRightRadius: spacingPresets.xs,
      padding: spacingPresets.md1,
      alignSelf: 'flex-end',
      marginLeft: 'auto',
    },
    userBubbleText: {
      ...typographyPresets.Body,
      color: colors.primaryAccentForeground,
      textAlign: 'left',
    },
    aiBubble: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      borderBottomLeftRadius: spacingPresets.xs,
      padding: spacingPresets.md1,
      flex: 1,
    },
    aiBubbleText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
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

  const latexMessageStyles: LatexMessageStyles = {
    textColor: colors.primaryForeground,
    fontSize: typographyPresets.Body.fontSize ?? 16,
  };

  const mediaActionStyles: MediaActionStyles = {
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacingPresets.md1,
      paddingHorizontal: spacingPresets.md2,
      paddingVertical: spacingPresets.xs,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  const newChatButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      paddingHorizontal: spacingPresets.md1,
      paddingVertical: spacingPresets.xs,
      minWidth: 0,
    },
    text: {
      ...typographyPresets.Caption,
      fontWeight: '600',
    },
  });

  return createAppPageStyles<AssistantStyles>({
    styles,
    customTextInputStyles,
    chatInputFooterBaseStyles,
    customHeaderStyles,
    quickActionChipStyles,
    latexMessageStyles,
    mediaActionStyles,
    newChatButtonStyles,
  });
}
