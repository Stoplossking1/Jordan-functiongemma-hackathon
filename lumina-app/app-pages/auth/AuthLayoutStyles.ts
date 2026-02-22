/**
 * Styling for the AuthLayout route
 */
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { ViewStyle } from 'react-native';

/**
 * Interface for the return value of the useAuthLayoutStyles hook
 */
export interface AuthLayoutStyles {
  /** Main container */
  container: ViewStyle;
}

/**
 * Custom hook that provides styles for the AuthLayout component
 */
export function useAuthLayoutStyles(): AuthLayoutStyles {
  const { createAppPageStyles, dimensions, colors, typographyPresets, buttonPresets, spacingPresets } =
    useStyleContext();

  const styles: AuthLayoutStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
  };

  return createAppPageStyles<AuthLayoutStyles>(styles);
}
