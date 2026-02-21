import { PurchasePlatformEnvironment, type PurchaseAppConfig } from '@shared/PurchaseConfig';

export const purchaseConfig: PurchaseAppConfig = {
  stripeApiSandboxPublishableKey: process.env.EXPO_PUBLIC_STRIPE_API_SANDBOX_PUBLISHABLE_KEY,
  stripeApiLivePublishableKey: process.env.EXPO_PUBLIC_STRIPE_API_LIVE_PUBLISHABLE_KEY,
  stripeCallbackUrl: process.env.EXPO_PUBLIC_STRIPE_CALLBACK_URL,
  purchaseEnv: (process.env.EXPO_PUBLIC_PURCHASE_ENV as PurchasePlatformEnvironment) ?? 'sandbox',
  revenueCatApiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  revenueCatApiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  revenueCatApiKeyTestStore: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE,
};

/**
 * @returns True if the purchase environment is sandbox, false otherwise.
 */
export function isPurchaseSandbox(): boolean {
  return purchaseConfig.purchaseEnv === 'sandbox';
}

/**
 * @returns True if the purchase environment is production, false otherwise.
 */
export function isPurchaseProduction(): boolean {
  return purchaseConfig.purchaseEnv === 'production';
}
