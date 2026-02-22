/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams, Stack } from 'expo-router';

import { useStackLayoutStyles } from '@/comp-lib/styles/useStackLayoutStyles';
import { useNav } from '@/comp-lib/navigation/useNav';
import OnboardingLayoutContainer from '@/app-pages/onboarding/OnboardingLayoutContainer';

export type OnboardingLayoutUrlParams = UnknownOutputParams;

export interface OnboardingLayoutProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: OnboardingLayoutUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;
}

/**
 * Onboarding flow layout for new users
 */
export default function OnboardingLayout(): ReactNode {
  const { defaultScreenOptions: defaultStackLayoutOptions } = useStackLayoutStyles();
  const { urlParams, setOptions } = useNav<OnboardingLayoutUrlParams>({ auth: true });

  return (
    <OnboardingLayoutContainer urlParams={urlParams} setNavigationOptions={setOptions}>
      <Stack screenOptions={{ ...defaultStackLayoutOptions, headerShown: false }}>
        <Stack.Screen
          name="profile"
          options={{
            title: 'About You',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="preferences"
          options={{
            title: 'Your Learning Goals',
            headerShown: false,
          }}
        />
      </Stack>
    </OnboardingLayoutContainer>
  );
}
