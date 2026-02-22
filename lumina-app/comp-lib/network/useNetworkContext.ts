import { useContext } from 'react';
import { NetworkContext, NetworkContextType } from './NetworkProvider';

/**
 * Custom hook to consume the NetworkContext
 * Provides access to all network status information and methods
 *
 * @returns NetworkContext containing network state, IP address, loading states, errors, and refresh methods
 *
 * @throws Error if used outside of a NetworkProvider
 *
 * @example
 * ```tsx
 * import { useNetworkContext } from './comp-lib/network';
 *
 * function MyComponent() {
 *   const { networkState, networkStateLoading } = useNetworkContext();
 *
 *   if (networkStateLoading) {
 *     return <Text>Loading network status...</Text>;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Connected: {networkState?.isConnected ? 'Yes' : 'No'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useNetworkContext(): NetworkContextType {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }

  return context;
}

// Re-export Expo Network types for convenience
export type { NetworkState, NetworkStateType } from 'expo-network';
