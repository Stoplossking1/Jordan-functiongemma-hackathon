/**
 * Platform environment for the purchase SDK
 */
export type PurchasePlatformEnvironment = 'sandbox' | 'production';

/**
 * Base configuration for the purchase SDK used by both the app and backend.
 */
export interface PurchaseBaseConfig {
  purchaseEnv: PurchasePlatformEnvironment;
}

/**
 * Platform specific api keys that can be stored on the app frontend
 */
export interface PurchaseAppConfig extends PurchaseBaseConfig {
  stripeApiSandboxPublishableKey?: string;
  stripeApiLivePublishableKey?: string;
  stripeCallbackUrl?: string;
  revenueCatApiKeyIos?: string;
  revenueCatApiKeyAndroid?: string;
  revenueCatApiKeyTestStore?: string;
}

/**
 * Platform specific api keys that should be stored on the backend and never exposed to the app frontend.
 */
export interface PurchaseBackendConfig extends PurchaseBaseConfig {
  stripeApiSandboxWebhookSigningSecret?: string;
  stripeApiSandboxSecretKey?: string;
  stripeApiLiveWebhookSigningSecret?: string;
  stripeApiLiveSecretKey?: string;
  stripeApiVersion?: string;
}
