import { type ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
export interface KeyboardAvoidingWrapperStyles {
  container: ViewStyle;
  content: ViewStyle;
}

export function useKeyboardAvoidingWrapperStyles(): KeyboardAvoidingWrapperStyles {
  const { createAppPageStyles } = useStyleContext();

  const styles: KeyboardAvoidingWrapperStyles = {
    container: {
      flex: 1,
    },
    content: {
      flexGrow: 1, // Ensures the ScrollView adapts dynamically
      justifyContent: 'space-between',
    },
  };

  return createAppPageStyles<KeyboardAvoidingWrapperStyles>(styles);
}
