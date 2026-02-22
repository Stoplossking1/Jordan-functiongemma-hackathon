import { useContext } from 'react';

import { ReactInspectorContext, type ReactInspectorContextValue } from './ReactInspectorContextProvider.tsx';

export function useReactInspectorContext(): ReactInspectorContextValue {
  const context = useContext(ReactInspectorContext);

  if (!context) {
    throw new Error('useReactInspectorContext must be used within a ReactInspectorContextProvider');
  }

  return context;
}
