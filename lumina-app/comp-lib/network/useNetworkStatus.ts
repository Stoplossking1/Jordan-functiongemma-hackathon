import { useCallback, useEffect, useState } from 'react';
import * as Network from 'expo-network';

/**
 * Interface for the network status hook return value
 */
export interface NetworkStatusHook {
  /** The current network state containing connection type, connectivity status, and other network information */
  networkState?: Network.NetworkState;
  /** Error message if network state fetching failed, undefined if no error */
  networkStateError?: string;
  /** Whether network state is currently being fetched */
  networkStateLoading: boolean;

  /** The device's current IP address, undefined if not available */
  ipAddress?: string;
  /** Error message if IP address fetching failed, undefined if no error */
  ipAddressError?: string;
  /** Whether IP address is currently being fetched */
  ipAddressLoading?: boolean;

  /** Function to manually refresh the network state */
  refreshNetworkState: () => Promise<void>;
  /** Function to manually refresh the IP address (currently disabled) */
  refreshIpAddress?: () => void;
  /** Function to refresh all network information (state and IP address) */
  refreshAll: () => Promise<void>;
}

/**
 * Custom hook that manages network status functionality
 * Handles network state monitoring, IP address retrieval, and provides refresh methods
 */
export function useNetworkStatus(): NetworkStatusHook {
  // Network State
  const [networkState, setNetworkState] = useState<Network.NetworkState | undefined>(undefined);
  const [networkStateError, setNetworkStateError] = useState<string | undefined>(undefined);
  const [networkStateLoading, setNetworkStateLoading] = useState(true);

  // IP Address
  // const [ipAddress, setIpAddress] = useState<string | undefined>(undefined);
  // const [ipAddressError, setIpAddressError] = useState<string | undefined>(undefined);
  // const [ipAddressLoading, setIpAddressLoading] = useState(true);

  /**
   * Fetches the current network state
   */
  const fetchNetworkState = useCallback(async () => {
    try {
      setNetworkStateLoading(true);
      setNetworkStateError(undefined);
      const state = await Network.getNetworkStateAsync();
      setNetworkState(state);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch network state';
      setNetworkStateError(errorMessage);
      setNetworkState(undefined);
    } finally {
      setNetworkStateLoading(false);
    }
  }, []);

  /**
   * Fetches the current IP address
   */
  // const fetchIpAddress = useCallback(async () => {
  //   try {
  //     setIpAddressLoading(true);
  //     setIpAddressError(undefined);
  //     const ip = await Network.getIpAddressAsync();
  //     setIpAddress(ip);
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch IP address';
  //     setIpAddressError(errorMessage);
  //     setIpAddress(undefined);
  //   } finally {
  //     setIpAddressLoading(false);
  //   }
  // }, []);

  /**
   * Refresh network state on demand
   */
  const refreshNetworkState = useCallback(async () => {
    await fetchNetworkState();
  }, [fetchNetworkState]);

  /**
   * Refresh IP address on demand
   */
  // const refreshIpAddress = useCallback(async () => {
  //   await fetchIpAddress();
  // }, [fetchIpAddress]);

  /**
   * Refresh all network information
   */
  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      fetchNetworkState(),
      // fetchIpAddress()
    ]);
  }, [
    fetchNetworkState,
    // fetchIpAddress
  ]);

  // Initial data fetch and network state listener setup
  useEffect(() => {
    // Initial fetch of both network state and IP address
    fetchNetworkState().catch((error) => {
      console.error('fetchNetworkState error:', error);
    });
    // fetchIpAddress();

    // Set up network state change listener
    const subscription = Network.addNetworkStateListener((state: Network.NetworkState) => {
      setNetworkState(state);
      setNetworkStateError(undefined);
      // Note: We don't set loading to false here as this is a live update
    });

    // Cleanup listener on unmount
    return () => {
      subscription?.remove();
    };
  }, [
    fetchNetworkState,
    // fetchIpAddress
  ]);

  return {
    // Network State
    networkState,
    networkStateError,
    networkStateLoading,

    // IP Address
    // ipAddress,
    // ipAddressError,
    // ipAddressLoading,

    // Refresh Methods
    refreshNetworkState,
    // refreshIpAddress,
    refreshAll,
  };
}
