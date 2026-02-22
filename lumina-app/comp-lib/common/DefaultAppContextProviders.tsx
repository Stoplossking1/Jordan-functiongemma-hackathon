import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { type PropsWithChildren, type ReactNode } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { OnboardingContextProvider } from '@/comp-lib/common/context/OnboardingContextProvider';
import { CrashAnalyticsProvider } from '@/comp-lib/crash-analytics/CrashAnalyticsProvider';
import { ErrorBoundary } from '@/comp-lib/errors/ErrorBoundary';
import { NavigationBridge } from '@/comp-lib/navigation/NavigationBridge';
import { ReactInspector } from '@/comp-lib/react-inspector/ReactInspector';
import { StyleProvider } from '@/comp-lib/styles/StyleContext';
import { ToastProvider } from '@/comp-lib/toast/ToastContext';
import { RevenueCatProvider } from '../integrations/revenue-cat/RevenueCatProvider';

export function DefaultAppContextProviders({ children }: PropsWithChildren): ReactNode {
  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <RevenueCatProvider enableDebugLogs={false}>
        <OnboardingContextProvider>
          <StyleProvider>
            <CrashAnalyticsProvider>
              <ErrorBoundary>
                <ReactInspector>
                  <NavigationBridge>
                    <ToastProvider>{children}</ToastProvider>
                  </NavigationBridge>
                </ReactInspector>
              </ErrorBoundary>
            </CrashAnalyticsProvider>
          </StyleProvider>
        </OnboardingContextProvider>
      </RevenueCatProvider>
    </SessionContextProvider>
  );
}
