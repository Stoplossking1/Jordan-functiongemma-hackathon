import { TextStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

/**
 * Interface for the return value of the useControlLabelStyles hook
 */
export interface ControlLabelStyles {
  title: TextStyle;
}

export function useControlLabelStyles(): ControlLabelStyles {
  const { typographyPresets, spacingPresets, colors } = useStyleContext();

  const styles: ControlLabelStyles = {
    title: {
      ...typographyPresets.Label,
      marginBottom: spacingPresets.xs,
      color: colors.primaryForeground,
    },
  };

  return styles;
}
