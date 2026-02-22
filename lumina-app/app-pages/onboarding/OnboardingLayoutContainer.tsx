/**
 * Main container for the OnboardingLayout route
 * @todo AUTO-GENERATED STUB - replace with actual implementation and content
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';

import { OnboardingLayoutProps } from '@/app/onboarding/_layout';
import { useOnboardingLayoutStyles } from './OnboardingLayoutStyles';

export default function OnboardingLayoutContainer(props: OnboardingLayoutProps): ReactNode {
  const { styles } = useOnboardingLayoutStyles();

  return <View style={styles.container}>{props.children}</View>;
}
