/**
 * Layout container for authentication
 */
import { type ReactNode } from 'react';
import { View } from 'react-native';

import { AuthLayoutProps } from '@/app/auth/_layout';

import { useAuthLayoutStyles } from './AuthLayoutStyles';

export default function AuthLayoutContainer(props: AuthLayoutProps): ReactNode {
  const styles = useAuthLayoutStyles();

  return <View style={styles.container}>{props.children}</View>;
}
