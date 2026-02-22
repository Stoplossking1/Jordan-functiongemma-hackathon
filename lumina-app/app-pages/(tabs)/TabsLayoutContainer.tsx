/**
 * Main container for the TabsLayout route
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';

import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/comp-lib/navigation/TabBarIcon';
import { TabsLayoutProps } from '@/app/(tabs)/_layout';
import { useTabsLayoutStyles } from './TabsLayoutStyles';

const TAB_ICON_SIZE = 26;

export default function TabsLayoutContainer(_props: TabsLayoutProps): ReactNode {
  const { tabsLayoutOptions } = useTabsLayoutStyles();

  return (
    <Tabs initialRouteName="home" screenOptions={tabsLayoutOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={TAB_ICON_SIZE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'trending-up' : 'trending-up-outline'}
              color={color}
              size={TAB_ICON_SIZE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={TAB_ICON_SIZE}
            />
          ),
        }}
      />
    </Tabs>
  );
}
