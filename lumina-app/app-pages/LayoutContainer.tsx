/**
 * Main container for the Layout route
 * @todo AUTO-GENERATED STUB - replace with actual implementation and content
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useWindowDimensions } from 'react-native';
import { AppStartRedirection } from '@/comp-app/auth/AppStartRedirection';

import { LayoutProps } from '@/app/_layout';
import { useLayout } from './LayoutFunc';
import { useLayoutStyles } from './LayoutStyles';

export default function LayoutContainer(props: LayoutProps): ReactNode {
  const { styles } = useLayoutStyles();

  const { loaded } = useLayout(props);
  const windowDimensions = useWindowDimensions();

  // wait for "windowDimensions.width" to prevent flickering on refresh (otherwise there is a quick switch from "isPhone" true to false)
  if (!loaded || !windowDimensions.width) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppStartRedirection {...props} />
      {props.children}
    </GestureHandlerRootView>
  );
}
