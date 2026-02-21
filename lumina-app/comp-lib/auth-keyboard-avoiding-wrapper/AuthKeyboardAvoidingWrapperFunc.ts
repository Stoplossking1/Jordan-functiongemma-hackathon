import { useEffect, useRef } from 'react';
import { Keyboard, Platform, type KeyboardAvoidingViewProps, LayoutAnimation, ScrollView } from 'react-native';
import { type AuthKeyboardAvoidingWrapperProps } from './AuthKeyboardAvoidingWrapper';

export interface AuthKeyboardAvoidingWrapperFunc {
  scrollViewRef?: React.RefObject<ScrollView | null>;
  keyboardVerticalOffset: number;
  keyboardAvoidingViewProps: Omit<KeyboardAvoidingViewProps, 'keyboardVerticalOffset' | 'style' | 'children'>;
  isWeb: boolean;
  platformBehavior: 'padding' | 'height' | undefined;
}

export function useAuthKeyboardAvoidingWrapper(
  props: AuthKeyboardAvoidingWrapperProps,
): AuthKeyboardAvoidingWrapperFunc {
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardVerticalOffset = props.keyboardVerticalOffset ?? 0;
  const isWeb = Platform.OS === 'web';
  const platformBehavior = Platform.OS === 'ios' ? 'padding' : 'height';

  // Extract the KeyboardAvoidingView specific props
  const { children, style, contentContainerStyle, onKeyboardWillShowChange, ...keyboardAvoidingViewProps } = props;

  useEffect(() => {
    if (isWeb) return;

    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardShowEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onKeyboardWillShowChange?.(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false }); // Scroll to the bottom
      }, 50);
    });

    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onKeyboardWillShowChange?.(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [isWeb, onKeyboardWillShowChange]);

  return {
    scrollViewRef: scrollViewRef ? scrollViewRef : undefined,
    keyboardVerticalOffset,
    keyboardAvoidingViewProps,
    isWeb,
    platformBehavior,
  };
}
