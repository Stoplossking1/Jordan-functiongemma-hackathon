/**
 * Styling for the NotFound page
 */
import { ViewStyle, TextStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

/**
 * Interface for base styles of the useNotFoundStyles hook
 */
export interface NotFoundBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  content: ViewStyle;
  illustrationContainer: ViewStyle;
  illustrationText: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  buttonContainer: ViewStyle;
}

/**
 * Interface for the return value of the useNotFoundStyles hook
 */
export interface NotFoundStyles {
  styles: NotFoundBaseStyles;
  goHomeButtonStyles: CustomButtonStyles;
}

/**
 * Custom hook that provides styles for the NotFound component
 */
export function useNotFoundStyles(): NotFoundStyles {
  const { createAppPageStyles, colors, typographyPresets, buttonPresets, spacingPresets, overrideStyles } =
    useStyleContext();

  const styles: NotFoundBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: spacingPresets.lg1,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 320,
    },
    illustrationContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.tertiaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacingPresets.lg1,
    },
    illustrationText: {
      fontSize: 56,
      lineHeight: 64,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryAccent,
      textAlign: 'center',
      marginBottom: spacingPresets.md1,
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      textAlign: 'center',
      marginBottom: spacingPresets.lg2,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 280,
    },
  };

  const goHomeButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
    },
  });

  return createAppPageStyles<NotFoundStyles>({ styles, goHomeButtonStyles });
}
