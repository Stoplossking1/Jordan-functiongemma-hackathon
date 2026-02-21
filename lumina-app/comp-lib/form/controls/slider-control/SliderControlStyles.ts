import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { TextStyle, ViewStyle } from 'react-native';

export interface SliderControlStyles {
  valueContainer: ViewStyle;
  valueText: TextStyle;
  labelText: TextStyle;
  slider: ViewStyle;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
}

export function useSliderControlStyles(): SliderControlStyles {
  const { colors, typographyPresets, spacingPresets } = useStyleContext();

  const styles: SliderControlStyles = {
    valueContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueText: {
      ...typographyPresets.Title,
      marginBottom: spacingPresets.md1,
    },
    labelText: {
      ...typographyPresets.Subtitle,
      marginTop: spacingPresets.sm,
    },
    slider: {
      width: '100%',
    },
    minimumTrackTintColor: colors.primaryAccent,
    maximumTrackTintColor: colors.tertiaryForeground,
  };

  return styles;
}
