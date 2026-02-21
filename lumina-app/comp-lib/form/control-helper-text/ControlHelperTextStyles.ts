import { TextStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

/**
 * Interface for the return value of the useControlHelperTextStyles hook
 */
export interface ControlHelperTextStyles {
  title: TextStyle;
}

export function useControlHelperTextStyles(): ControlHelperTextStyles {
  const { typographyPresets, spacingPresets, colors } = useStyleContext();

  const styles: ControlHelperTextStyles = {
    title: {
      ...typographyPresets.Caption,
      marginTop: spacingPresets.xs,
      color: colors.secondaryForeground,
    },
  };

  return styles;
}
