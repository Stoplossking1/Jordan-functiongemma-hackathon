/**
 * Styling for the LaTeX Renderer component
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

export interface LatexRendererStyles {
  container: ViewStyle;
  text: TextStyle;
  inlineLatexContainer: ViewStyle;
  blockLatexContainer: ViewStyle;
  latexContent: ViewStyle;
}

export function useLatexRendererStyles(): LatexRendererStyles {
  const { typographyPresets, spacingPresets, colors } = useStyleContext();

  const styles: LatexRendererStyles = {
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    text: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
    },
    inlineLatexContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    blockLatexContainer: {
      width: '100%',
      paddingVertical: spacingPresets.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    latexContent: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
  };

  return styles;
}

