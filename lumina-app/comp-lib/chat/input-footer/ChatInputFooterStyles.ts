import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import type { ViewStyle } from 'react-native';
import {
  CustomTextInputStyles,
  DEFAULT_SINGLELINE_INPUT_HEIGHT,
} from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

export interface ChatInputFooterBaseStyles {
  container: ViewStyle;
  subContainer: ViewStyle;
}

export interface ChatInputFooterStyles {
  styles: ChatInputFooterBaseStyles;
  customTextInputStyles: CustomTextInputStyles;
  sendButtonStyles: CustomButtonStyles;
}

export function useChatInputFooterStyles(multiline?: boolean): ChatInputFooterStyles {
  const {
    typographyPresets,
    createAppPageStyles,
    colors,
    overrideStyles,
    buttonPresets,
    textInputPresets,
    spacingPresets,
  } = useStyleContext();

  const styles: ChatInputFooterBaseStyles = {
    container: {
      backgroundColor: colors.secondaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.tertiaryBackground,
      paddingHorizontal: spacingPresets.lg1,
      paddingVertical: spacingPresets.md1,
      justifyContent: 'center',
      minHeight: 64, // required for keyboard offset;
      maxHeight: 160,
    },
    subContainer: {
      flexGrow: 1, // required for auto grow multiline
      flexShrink: 1, // required for auto grow multiline
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.sm,
    },
  };

  const customTextInputStyles = overrideStyles(
    multiline ? textInputPresets.MultilineInput : textInputPresets.DefaultInput,
    {
      wrapper: {
        flex: 1,
      },
      container: {
        borderColor: colors.tertiaryForeground,
        minHeight: multiline ? DEFAULT_SINGLELINE_INPUT_HEIGHT : undefined,
      },
    },
  );

  const sendButtonStyles = overrideStyles(buttonPresets.Primary, {
    iconOnlyContainer: {
      width: 32,
      height: 32,
    },
    text: {
      color: colors.primaryAccentForeground,
    },
  });

  return createAppPageStyles<ChatInputFooterStyles>({
    styles,
    customTextInputStyles,
    sendButtonStyles,
  });
}
