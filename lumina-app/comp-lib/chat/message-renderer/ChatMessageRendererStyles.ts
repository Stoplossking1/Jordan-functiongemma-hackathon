import { TextStyle, ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

/**
 * Interface for the return value of the useChatMessageRendererStyles hook
 */
export interface ChatMessageRendererStyles {
  container: ViewStyle;
  avatarMessageContainer: ViewStyle;
  avatarMessageContainerLeft: ViewStyle;
  avatarMessageContainerRight: ViewStyle;
  avatar: ViewStyle;
  avatarLeft: ViewStyle;
  avatarRight: ViewStyle;
  avatarText: TextStyle;
  avatarLeftText: TextStyle;
  avatarRightText: TextStyle;
  senderNameText: TextStyle;
  messageContainer: ViewStyle;
  messageContainerLeft: ViewStyle;
  messageContainerRight: ViewStyle;
  bubble: ViewStyle;
  rightBubble: ViewStyle;
  leftBubble: ViewStyle;
  rightBubbleText: TextStyle;
  leftBubbleText: TextStyle;
}

export function useChatMessageRendererStyles(): ChatMessageRendererStyles {
  const { typographyPresets, spacingPresets, colors } = useStyleContext();

  const styles: ChatMessageRendererStyles = {
    container: {
      marginVertical: spacingPresets.sm,
    },
    avatarMessageContainer: {
      maxWidth: '80%',
      gap: spacingPresets.sm,
      justifyContent: 'flex-start',
    },
    avatarMessageContainerLeft: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
    },
    avatarMessageContainerRight: {
      flexDirection: 'row-reverse', // Aligns the avatar to the right for user messages
      alignSelf: 'flex-end',
    },
    avatar: {
      alignSelf: 'flex-start',
      width: spacingPresets.lg2,
      height: spacingPresets.lg2,
      padding: spacingPresets.xxs,
      borderRadius: 9999,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarLeft: {
      backgroundColor: colors.primaryAccent,
    },
    avatarRight: {
      backgroundColor: colors.tertiaryBackground,
      borderWidth: 1,
      borderColor: colors.primaryAccent,
    },
    avatarText: {
      ...typographyPresets.Caption,
      textAlign: 'center',
    },
    avatarLeftText: {
      color: colors.primaryAccentForeground,
    },
    avatarRightText: {
      color: colors.primaryAccent,
    },
    senderNameText: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
      paddingVertical: spacingPresets.sm,
    },
    messageContainer: {
      flexDirection: 'column',
      width: '100%',
    },
    messageContainerLeft: {
      alignItems: 'flex-start',
    },
    messageContainerRight: {
      alignItems: 'flex-end',
    },
    bubble: {
      flexDirection: 'column',
      padding: spacingPresets.md1,
      borderRadius: spacingPresets.md1,
    },
    rightBubble: {
      alignItems: 'flex-end',
      backgroundColor: colors.primaryAccent,
      borderTopRightRadius: spacingPresets.sm,
    },
    leftBubble: {
      alignItems: 'flex-start',
      backgroundColor: colors.secondaryBackground,
      borderTopLeftRadius: spacingPresets.sm,
    },
    rightBubbleText: {
      ...typographyPresets.Body,
      color: colors.primaryAccentForeground,
      textAlign: 'left',
    },
    leftBubbleText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
  };

  return styles;
}
