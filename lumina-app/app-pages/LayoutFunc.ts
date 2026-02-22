/**
 * Layout component that handles app state changes, font loading and app startup redirection
 * @todo AUTO-GENERATED STUB - replace with actual implementation
 */

import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { LayoutProps } from '@/app/_layout';
import { useLoadFonts } from '@/comp-lib/styles/useLoadFonts';
import { INSPECTOR_ENABLED } from '@/config';

SplashScreen.preventAutoHideAsync().catch((err) => {
  console.log('Error prevent hiding splash screen:', err);
});

export interface LayoutFunc extends PropsWithChildren {
  /**
   * Indicates whether fonts have been loaded
   */
  loaded: boolean;
}

export function useLayout(props: LayoutProps): LayoutFunc {
  const { loaded } = useLoadFonts();
  const [isClientSideReact, setIsClientSideReact] = useState(false);

  /*
   * Useful to determine if the component is mounted on the client side to avoid hydration issues.
   *
   * We mutate the javascript bundle with props during the metro transformation process through a custom babel plugin.
   * This leads to a mismatch between server and client rendered content, which raises hydration warnings.
   * To avoid these warnings, we only render the root layout after confirming that we are on the client side.
   * https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content
   */
  useEffect(() => {
    // Only set client side react flag if inspector is enabled
    if (!INSPECTOR_ENABLED) return;
    setIsClientSideReact(true);
  }, []);

  return { loaded: loaded && (!INSPECTOR_ENABLED || isClientSideReact) };
}
