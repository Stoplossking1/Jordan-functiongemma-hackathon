import { ViewStyle, TextStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

export interface NavigationActionBaseStyles {
  container: ViewStyle;
  pressable: ViewStyle;
  iconContainer: ViewStyle;
  icon: ViewStyle;
  content: ViewStyle;
  titleText: TextStyle;
  descriptionText: TextStyle;
}

export interface NavigationActionStyles {
  styles: NavigationActionBaseStyles;
}

export function useNavigationActionStyles(): NavigationActionStyles {
  const { colors, spacingPresets, typographyPresets, borderRadiusPresets } = useStyleContext();

  const styles: NavigationActionBaseStyles = {
    container: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md1,
      marginVertical: spacingPresets.xs,
    },
    pressable: {
      width: '100%',
    },
    iconContainer: {
      marginRight: spacingPresets.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      backgroundColor: colors.secondaryForeground,
    },
    content: {
      flex: 1,
      flexDirection: 'column',
    },
    titleText: {
      ...typographyPresets.Body,
      color: colors.primaryForeground,
      fontWeight: 'bold',
    },
    descriptionText: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
      marginTop: spacingPresets.sm,
    },
  };

  return { styles };
}
