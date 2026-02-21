import { type ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
export interface AuthKeyboardAvoidingWrapperStyles {
  container: ViewStyle;
  content: ViewStyle;
}

export function useAuthKeyboardAvoidingWrapperStyles(): AuthKeyboardAvoidingWrapperStyles {
  const { createAppPageStyles } = useStyleContext();

  const styles: AuthKeyboardAvoidingWrapperStyles = {
    container: {
      flex: 1,
    },
    content: {
      flexGrow: 1, // Ensures the ScrollView adapts dynamically
    },
  };

  return createAppPageStyles<AuthKeyboardAvoidingWrapperStyles>(styles);
}
