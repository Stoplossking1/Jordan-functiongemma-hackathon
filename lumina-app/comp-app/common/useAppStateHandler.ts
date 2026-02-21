/**
 * App State handler: Manages app state transitions between foreground, background, and inactive states,
 * handling authentication refresh and other state-dependent operations
 * @todo AUTO-GENERATED STUB - replace with actual implementation if needed
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { supabaseClient } from '@/api/supabase-client';

let isInitialized = false;
/**
 * Interface for the return value of the useAppStateHandler hook
 */
export interface AppStateHandlerFunc {
  // TODO: Add app state specific properties as needed
}

export function useAppStateHandler(): AppStateHandlerFunc {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    //only call this once!!!
    if (!isInitialized) {
      isInitialized = true;
      // https://reactnative.dev/docs/appstate
      // https://supabase.com/docs/reference/javascript/auth-startautorefresh

      // IMPORTANT: Handle the initial state immediately
      // This runs the startup logic without waiting for a state change
      const initialState = AppState.currentState;
      console.log('Initial app state:', initialState);

      // If app is active on startup (default value), start auto refresh immediately. The event listener won't fire on startup
      if (initialState === 'active') {
        console.log('Starting auto refresh on initial load');
        supabaseClient.auth.startAutoRefresh().catch((error) => {
          console.error('startAutoRefresh error:', error);
        });
      }
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        console.log(appState.current);
        if ((appState.current === 'inactive' || appState.current === 'background') && nextAppState === 'active') {
          supabaseClient.auth.startAutoRefresh().catch((error) => {
            console.error('startAutoRefresh error:', error);
          });
        } else if (appState.current === 'active' && (nextAppState === 'inactive' || nextAppState === 'background')) {
          supabaseClient.auth.stopAutoRefresh().catch((error) => {
            console.error('stopAutoRefresh error:', error);
          });
        }
        appState.current = nextAppState;
        console.log('AppState: ', appState.current);
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return {};
}
