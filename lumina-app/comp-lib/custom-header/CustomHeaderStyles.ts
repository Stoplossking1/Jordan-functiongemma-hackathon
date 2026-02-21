import { TextStyle, ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

export interface CustomHeaderStyles {
  container: ViewStyle;
  mainContainer: ViewStyle;
  headerLeft: ViewStyle;
  headerCenter: ViewStyle;
  headerRight: ViewStyle;
  title: TextStyle;
  backCustomButtonStyles: CustomButtonStyles;
}

export function useCustomHeaderStyles(): CustomHeaderStyles {
  const { typographyPresets, createAppPageStyles, colors, overrideStyles, buttonPresets, spacingPresets } =
    useStyleContext();

  const customHeaderStyles: CustomHeaderStyles = {
    container: {
      flexGrow: 0,
      paddingHorizontal: spacingPresets.lg1,
      backgroundColor: colors.primaryBackground,
    },
    mainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
      backgroundColor: 'transparent',
    },
    headerLeft: {
      minWidth: 60,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRight: {
      minWidth: 60,
    },
    title: {
      ...typographyPresets.Label,
      color: colors.primaryForeground,
    },
    backCustomButtonStyles: overrideStyles(buttonPresets.Tertiary, {
      iconOnlyContainer: {
        marginLeft: -4, // align icon as it has some space ~4px
        height: '100%',
        width: '100%',
        borderRadius: 0,
        justifyContent: 'flex-start',
      },
      text: {
        fontSize: spacingPresets.lg1,
        color: colors.tertiaryForeground,
      },
    }),
  };

  return createAppPageStyles<CustomHeaderStyles>(customHeaderStyles);
}
