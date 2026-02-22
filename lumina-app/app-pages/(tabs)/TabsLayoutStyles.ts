import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useTabLayoutStyles } from '@/comp-lib/styles/useTabLayoutStyles';

export interface TabsLayoutBaseStyles {}

export interface TabsLayoutStyles {
  styles: TabsLayoutBaseStyles;
  // MUST NOT add tabBarStyle as it is already handled in useTabLayoutStyles and will break UI otherwise
  tabsLayoutOptions: BottomTabNavigationOptions;
}

export function useTabsLayoutStyles(): TabsLayoutStyles {
  const { colors, scaleProperties } = useStyleContext();

  const tabsLayoutOptions = useTabLayoutStyles({
    baseHeight: 64,
    tabBarBackgroundColor: colors.secondaryBackground,
    tabBarActiveTintColor: colors.primaryAccent,
    tabBarInactiveTintColor: colors.secondaryForeground,
  });

  const scaledTabsLayoutOptions = scaleProperties<BottomTabNavigationOptions>(tabsLayoutOptions);

  const styles: TabsLayoutBaseStyles = {};
  const scaledStyles = scaleProperties<TabsLayoutBaseStyles>(styles);

  return { styles: scaledStyles, tabsLayoutOptions: scaledTabsLayoutOptions };
}
