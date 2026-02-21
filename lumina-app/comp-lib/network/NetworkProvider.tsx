import { type PropsWithChildren, type ReactNode, createContext } from 'react';
import { useNetworkStatus, type NetworkStatusHook } from './useNetworkStatus';

/**
 * NetworkProviderProps is a shared interface for a network provider props.
 */
export interface NetworkProviderProps extends PropsWithChildren {}

/**
 * NetworkContext is the context object that holds the network-related data and functions.
 */
export interface NetworkContextType extends NetworkStatusHook {}

// Initialize the context
export const NetworkContext = createContext<NetworkContextType>({
  // Network State
  networkState: undefined,
  networkStateError: undefined,
  networkStateLoading: false,

  // Refresh Methods
  refreshNetworkState: () => {
    throw new Error(
      '"refreshNetworkState" function not implemented. Are you calling this outside of a NetworkProvider?',
    );
  },
  refreshAll: () => {
    throw new Error('"refreshAll" function not implemented. Are you calling this outside of a NetworkProvider?');
  },
});

/**
 * NetworkProvider is a wrapper component that provides the necessary context for network status functionality.
 * It automatically sets up network state listeners and provides methods to refresh network information on demand.
 *
 * @param props - The props for the NetworkProvider component.
 *
 * @example
 * ```tsx
 * import { NetworkProvider } from './comp-lib/network';
 *
 * function App() {
 *   return (
 *     <NetworkProvider>
 *       <YourAppComponents />
 *     </NetworkProvider>
 *   );
 * }
 * ```
 */
export function NetworkProvider(props: NetworkProviderProps): ReactNode {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkContext.Provider
      value={{
        ...networkStatus,
      }}
    >
      {props.children}
    </NetworkContext.Provider>
  );
}
