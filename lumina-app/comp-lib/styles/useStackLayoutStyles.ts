import { useThemedStyles } from './useThemedStyles';
import { useMemo } from 'react';

/**
 * Interface for the return value of the useStackLayoutStyles hook
 */
export interface StackLayoutStyles {
  /**
   * Default screen options for stack navigator
   */
  defaultScreenOptions: {
    /**
     * Whether the header is shown
     */
    headerShown: boolean;

    /**
     * Style for the screen content background
     */
    contentStyle: {
      backgroundColor: string;
    };
  };
}

export function useStackLayoutStyles(): StackLayoutStyles {
  const { colors } = useThemedStyles();

  const defaultScreenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.primaryBackground },
    }),
    [colors],
  );
  return { defaultScreenOptions };
}
