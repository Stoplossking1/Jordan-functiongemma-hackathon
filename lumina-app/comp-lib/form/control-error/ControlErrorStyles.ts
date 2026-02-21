import { TextStyle, ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

export interface ControlErrorStyles {
  container: ViewStyle;
  title: TextStyle;
}

export function useControlErrorStyles(): ControlErrorStyles {
  const { typographyPresets, spacingPresets, colors } = useStyleContext();

  const styles: ControlErrorStyles = {
    container: {
      minHeight: typographyPresets.Caption.lineHeight,
      marginTop: spacingPresets.xs,
    },
    title: {
      ...typographyPresets.Caption,
      color: colors.customColors?.error ?? 'red', // in case if llm will not create error custom color
    },
  };

  return styles;
}
