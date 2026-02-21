import { type ReactNode } from 'react';

import { LayoutProps } from '@/app/_layout';
import { useAppStartRedirection } from './AppStartRedirectionFunc';

// has to be in a separate ReactNode (can't be placed inside LayoutFunc) as useAppRedirection uses "useSegments" that force re-render on each route change and we need main LayoutContainer to be rendered only once
export function AppStartRedirection(props: LayoutProps): ReactNode {
  useAppStartRedirection(props);

  return null;
}
