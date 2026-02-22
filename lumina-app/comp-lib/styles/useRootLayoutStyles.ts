import { useThemedStyles } from './useThemedStyles';
import { useResponsiveDesign } from './useResponsiveDesign';
import { ViewStyle } from 'react-native';

/** Interface for the base styles directly used on the component */
export interface RootLayoutBaseStyles {
  /** Root container style */
  container: ViewStyle;
}

/**
 * Interface for the return value of the useRootLayoutStyles hook
 */
export interface RootLayoutStyles {
  /**
   * React Native styles used for layout and UI of the root container
   */
  styles: RootLayoutBaseStyles;
}

/**
 * Custom hook that provides styles for the root layout container
 * @returns RootLayoutStyles - Object containing styles for the root layout
 */
export function useRootLayoutStyles(): RootLayoutStyles {
  const { createAppPageStyles } = useResponsiveDesign();
  const { colors } = useThemedStyles();

  const styles: RootLayoutBaseStyles = {
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'stretch',
      backgroundColor: colors.primaryBackground,
    },
  };

  return createAppPageStyles<RootLayoutStyles>({ styles });
}
