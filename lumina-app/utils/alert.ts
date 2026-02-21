import { Alert, Platform } from 'react-native';

// Addresses "Alert" not available on web
// https://stackoverflow.com/questions/65481226/react-native-alert-alert-only-works-on-ios-and-android-not-web

function alertPolyfill(
  title: string,
  description?: string,
  options?: {
    text: string;
    onPress?: () => void;
    style?: string;
  }[],
) {
  const result = window.confirm([title, description].filter(Boolean).join('\n'));

  if (result) {
    const confirmOption = options?.find(({ style }) => style !== 'cancel');
    confirmOption?.onPress?.();
  } else {
    const cancelOption = options?.find(({ style }) => style === 'cancel');
    cancelOption?.onPress?.();
  }
}

export const alert = Platform.OS === 'web' ? alertPolyfill : Alert.alert;
