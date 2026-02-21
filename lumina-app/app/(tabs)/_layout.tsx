/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams, Slot } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import TabsLayoutContainer from '@/app-pages/(tabs)/TabsLayoutContainer';

export type TabsLayoutUrlParams = UnknownOutputParams;

export interface TabsLayoutProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: TabsLayoutUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;
}

/**
 * Main app tab navigation for authenticated users
 */
export default function TabsLayout(): ReactNode {
  const { urlParams, setOptions } = useNav<TabsLayoutUrlParams>({ auth: true });

  return (
    <TabsLayoutContainer urlParams={urlParams} setNavigationOptions={setOptions}>
      <Slot />
    </TabsLayoutContainer>
  );
}
