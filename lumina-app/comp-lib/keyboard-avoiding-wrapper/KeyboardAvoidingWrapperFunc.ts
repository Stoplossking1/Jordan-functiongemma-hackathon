import { useRef } from 'react';
import { KeyboardAwareScrollViewProps, KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';

export interface KeyboardAvoidingWrapperFunc {
  scrollViewRef?: React.RefObject<KeyboardAwareScrollView | null>;
  isPlatformWeb: boolean;
}

export function useKeyboardAvoidingWrapper(props: KeyboardAwareScrollViewProps): KeyboardAvoidingWrapperFunc {
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const { isPlatformWeb } = useResponsiveDesign();

  return {
    scrollViewRef,
    isPlatformWeb,
  };
}
