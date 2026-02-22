import { type PropsWithChildren, type ReactNode } from 'react';

import { DefaultAppContextProviders } from '@/comp-lib/common/DefaultAppContextProviders';

export function AppContextProviders({ children }: PropsWithChildren): ReactNode {
  return <DefaultAppContextProviders>{children}</DefaultAppContextProviders>;
}
