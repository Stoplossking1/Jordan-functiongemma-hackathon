import { Ref, type ReactNode } from 'react';
import { TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewProps } from 'react-native-keyboard-aware-scroll-view';
import { useKeyboardAvoidingWrapper } from './KeyboardAvoidingWrapperFunc';
import { useKeyboardAvoidingWrapperStyles } from './KeyboardAvoidingWrapperStyles';

export function KeyboardAvoidingWrapper(props: KeyboardAwareScrollViewProps): ReactNode {
  const styles = useKeyboardAvoidingWrapperStyles();
  const { scrollViewRef, isPlatformWeb } = useKeyboardAvoidingWrapper(props);

  if (isPlatformWeb) {
    return (
      <ScrollView
        ref={scrollViewRef as Ref<ScrollView> | undefined}
        style={[styles.container, props.style]}
        contentContainerStyle={[styles.content, props.contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {props.children}
      </ScrollView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView
        ref={scrollViewRef as Ref<KeyboardAwareScrollView> | undefined}
        style={[styles.container, props.style]}
        contentContainerStyle={[styles.content, props.contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
      >
        {props.children}
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}
