/**
 * Styling for the Html page
 * @todo AUTO-GENERATED STUB - replace with actual implementation and content
 * Implementation instructions:
 * All styles for custom or core components need to be extended using the
 * overrideStyles function from StyleContext using the example styles provided.
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles, CustomButtonPresetStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for base styles of the useHtmlStyles hook
 */
export interface HtmlBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  content: ViewStyle;
  buttons: ViewStyle;
}

/**
 * Interface for the return value of the useHtmlStyles hook
 */
export interface HtmlStyles {
  styles: HtmlBaseStyles;
  navigationButtonStyles: CustomButtonStyles;
}

/**
 * Custom hook that provides styles for the Html component
 */
export function useHtmlStyles(): HtmlStyles {
  const { createAppPageStyles, dimensions, colors, typographyPresets, buttonPresets, spacingPresets, overrideStyles } =
    useStyleContext();

  const styles: HtmlBaseStyles = {
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      marginTop: spacingPresets.md2,
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryForeground,
      marginTop: spacingPresets.xl,
      textAlign: 'center',
    },
    description: {
      ...typographyPresets.Subtitle,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.md2,
    },
    content: {
      flex: 1,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    buttons: {
      alignItems: 'flex-start',
      marginTop: spacingPresets.xl,
    },
  };

  const navigationButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      margin: spacingPresets.md2,
    },
  });

  return createAppPageStyles<HtmlStyles>({ styles, navigationButtonStyles });
}
