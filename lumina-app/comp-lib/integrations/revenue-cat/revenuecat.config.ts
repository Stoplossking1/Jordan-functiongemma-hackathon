import { Platform } from 'react-native';

import { isPurchaseSandbox, purchaseConfig } from '@/config.purchase';

/**
 * Gets the appropriate RevenueCat API key based on the current environment and platform.
 * - In sandbox: Uses the Test Store key
 * - In production: Uses the platform-specific key (iOS or Android)
 */
export function getRevenueCatApiKey(): string | undefined {
  if (isPurchaseSandbox()) {
    return purchaseConfig.revenueCatApiKeyTestStore;
  }

  // Production: use platform-specific keys
  if (Platform.OS === 'ios') {
    return purchaseConfig.revenueCatApiKeyIos;
  }
  if (Platform.OS === 'android') {
    return purchaseConfig.revenueCatApiKeyAndroid;
  }

  return undefined;
}
