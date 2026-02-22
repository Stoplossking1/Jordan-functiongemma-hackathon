/**
 * Styling for the OnboardingLayout layout
 * @todo AUTO-GENERATED STUB - replace with actual implementation and content
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles, CustomButtonPresetStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for base styles of the useOnboardingLayoutStyles hook
 */
export interface OnboardingLayoutBaseStyles {
  container: ViewStyle;
}

/**
 * Interface for the return value of the useOnboardingLayoutStyles hook
 */
export interface OnboardingLayoutStyles {
  styles: OnboardingLayoutBaseStyles;
}

/**
 * Custom hook that provides styles for the OnboardingLayout component
 */
export function useOnboardingLayoutStyles(): OnboardingLayoutStyles {
  const { createAppPageStyles, dimensions, colors, typographyPresets, buttonPresets, spacingPresets } =
    useStyleContext();

  const styles: OnboardingLayoutBaseStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
  };

  return createAppPageStyles<OnboardingLayoutStyles>({ styles });
}
