import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import { t } from '@/i18n';
import { JSX } from 'react';
import { TextInput, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { ChatInputFooterBaseStyles, useChatInputFooterStyles } from './ChatInputFooterStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
export interface ChatInputFooterProps {
  inputRef: React.RefObject<TextInput | null>;
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: () => void;
  isSendDisabled: boolean;
  chatInputFooterBaseStyles?: ChatInputFooterBaseStyles;
  customTextInputStyles?: CustomTextInputStyles;
  sendCustomButtonStyles?: CustomButtonStyles;
  CustomSendButtonIconComponent?: JSX.Element;
  multiline?: boolean;
}

export function ChatInputFooter(props: ChatInputFooterProps): JSX.Element {
  const {
    styles: defaultChatInputFooterBaseStyles,
    customTextInputStyles: defaultCustomTextInputStyles,
    sendButtonStyles: defaultSendCustomButtonStyles,
  } = useChatInputFooterStyles(props.multiline);

  const styles = props.chatInputFooterBaseStyles ?? defaultChatInputFooterBaseStyles;

  return (
    <View style={styles.container}>
      <View style={styles.subContainer}>
        <CustomTextInput
          ref={props.inputRef}
          styles={props.customTextInputStyles ?? defaultCustomTextInputStyles}
          value={props.inputText}
          onChangeText={props.onInputChange}
          placeholder={t('chat.inputPlaceholder')}
          multiline={props.multiline}
        />
        <CustomButton
          styles={props.sendCustomButtonStyles ?? defaultSendCustomButtonStyles}
          onPress={props.onSend}
          disabled={props.isSendDisabled}
          leftIcon={({ size, color }) =>
            props.CustomSendButtonIconComponent ?? <AntDesign name="arrow-right" size={size} color={color} />
          }
        />
      </View>
    </View>
  );
}
