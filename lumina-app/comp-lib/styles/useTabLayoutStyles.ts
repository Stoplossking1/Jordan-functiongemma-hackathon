import { Platform, type StyleProp, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useStyleContext } from './StyleContext';
import { spacingPresets } from './Styles';

interface CustomTabLayoutStylesProps {
  /**
   * base height of the tab bar without safe area insets; 56–70 px is a good range
   */
  baseHeight?: number;
  /**
   * best UI: use a surface color that balances with "colors.primaryBackground"
   * avoid bright brand colors here; keep it neutral so icons/tints remain clear
   */
  tabBarBackgroundColor?: string;
  tabBarActiveTintColor?: string;
  tabBarInactiveTintColor?: string;
  /**
   * MUST NOT add color style otherwise "tabBarActiveTintColor" not working on the label
   * default style provided in "useTabLayoutStyles":
   *  fontFamily: typographyPresets.Caption.fontFamily,
      fontSize: typographyPresets.Caption.fontSize,
      lineHeight: typographyPresets.Caption.lineHeight,
      fontWeight: 'bold',
      marginTop: spacingPresets.xs,
   */
  extraTabBarLabelStyle?: StyleProp<TextStyle>;
  tabBarIconStyle?: StyleProp<TextStyle>;
  /**
   * Only set "tabBarActiveBackgroundColor" if explicitly requested,
   * and then use a very subtle shade of the existing background
   * (never a high-contrast or brand color)
   */
  tabBarActiveBackgroundColor?: string;
}

export function useTabLayoutStyles(props: CustomTabLayoutStylesProps): BottomTabNavigationOptions {
  const { colors, typographyPresets } = useStyleContext();
  const insets = useSafeAreaInsets();

  const baseHeight = props.baseHeight ?? 60;
  // enforce at least 60px
  const height = Math.max(60, baseHeight + insets.bottom);

  const tabsLayoutOptions: BottomTabNavigationOptions = {
    tabBarActiveTintColor: props.tabBarActiveTintColor ?? colors.primaryAccentDark,
    headerShown: false,
    tabBarInactiveTintColor: props.tabBarInactiveTintColor ?? colors.tertiaryForeground,
    sceneStyle: { backgroundColor: colors.primaryBackground },
    tabBarStyle: {
      backgroundColor: props.tabBarBackgroundColor,
      height,
      paddingBottom: insets.bottom,
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web' && {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
      }),
    },
    tabBarLabelStyle: {
      fontFamily: typographyPresets.Caption.fontFamily,
      fontSize: typographyPresets.Caption.fontSize,
      lineHeight: typographyPresets.Caption.lineHeight,
      fontWeight: 'bold',
      marginTop: spacingPresets.xs,
      ...(props.extraTabBarLabelStyle && {}),
    },
    tabBarIconStyle: props.tabBarIconStyle ?? {
      marginTop: spacingPresets.xs,
    },
    tabBarActiveBackgroundColor: props.tabBarActiveBackgroundColor,
  };

  return tabsLayoutOptions;
}
