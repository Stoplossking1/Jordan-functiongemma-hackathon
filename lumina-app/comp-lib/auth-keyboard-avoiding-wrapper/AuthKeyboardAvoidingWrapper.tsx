import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ScrollView,
  type KeyboardAvoidingViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAuthKeyboardAvoidingWrapper } from './AuthKeyboardAvoidingWrapperFunc';
import { useAuthKeyboardAvoidingWrapperStyles } from './AuthKeyboardAvoidingWrapperStyles';

export interface AuthKeyboardAvoidingWrapperProps extends KeyboardAvoidingViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onKeyboardWillShowChange?: (didShow: boolean) => void;
}

export function AuthKeyboardAvoidingWrapper(props: AuthKeyboardAvoidingWrapperProps): ReactNode {
  const styles = useAuthKeyboardAvoidingWrapperStyles();
  const { scrollViewRef, keyboardVerticalOffset, keyboardAvoidingViewProps, isWeb, platformBehavior } =
    useAuthKeyboardAvoidingWrapper(props);

  return isWeb ? (
    <View style={[styles.container, props.style]}>{props.children}</View>
  ) : (
    <KeyboardAvoidingView
      style={[styles.container, props.style]}
      behavior={platformBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      {...keyboardAvoidingViewProps}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef ?? undefined}
          contentContainerStyle={[styles.content, props.contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {props.children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
