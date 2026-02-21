/**
 * Styling for the Layout layout
 * @todo AUTO-GENERATED STUB - replace with actual implementation and content
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles, CustomButtonPresetStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for base styles of the useLayoutStyles hook
 */
export interface LayoutBaseStyles {
  container: ViewStyle;
}

/**
 * Interface for the return value of the useLayoutStyles hook
 */
export interface LayoutStyles {
  styles: LayoutBaseStyles;
}

/**
 * Custom hook that provides styles for the Layout component
 */
export function useLayoutStyles(): LayoutStyles {
  const { createAppPageStyles, dimensions, colors, typographyPresets, buttonPresets, spacingPresets } =
    useStyleContext();

  const styles: LayoutBaseStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
  };

  return createAppPageStyles<LayoutStyles>({ styles });
}
