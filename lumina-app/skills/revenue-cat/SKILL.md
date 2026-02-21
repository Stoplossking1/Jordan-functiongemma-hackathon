---
name: revenue-cat
description: Implement in-app purchases and subscriptions using RevenueCat on the Woz platform. Use when adding paywalls, making purchases, checking subscription status, or managing entitlements. Covers RevenueCat SDK usage with Woz's pre-built integration, RevenueCat MCP for backend management, and troubleshooting token refresh issues.
---

# RevenueCat on Woz

## Critical: Woz Integration Already Exists

**DO NOT implement your own RevenueCat initialization, user login/logout, or SDK configuration.** Woz provides a pre-built integration at `@/comp-lib/integrations/revenue-cat/` that handles:

- SDK initialization with environment-appropriate API keys
- Automatic user authentication sync (users logged into Supabase are auto-logged into RevenueCat)
- User logout handling via `useRevenueCat()` hook
- Platform detection (iOS/Android/Test Store)
- Debug logging in sandbox environments

The `<RevenueCatProvider>` component wraps the app and manages all SDK lifecycle. Simply use the SDK methods for purchases and subscriptions.

## Setup Verification

Before implementing purchases, verify RevenueCat is configured:

1. Check frontend environment variables for RevenueCat API keys, project ID, and project name.
2. IF keys or project id is missing: Notify user to connect RevenueCat via "Connect with RevenueCat" in Woz Dashboard
3. IF you can't access the environment variables, you can list the projects via the RevenueCat MCP. Do not just pick a project at random IF multiple are found. ALWAYS ask the user to specify which project to use.

## Presenting a Paywall

Use `react-native-purchases-ui` for pre-built paywalls configured in RevenueCat Dashboard:

```tsx
import RevenueCatUI from 'react-native-purchases-ui';

// Present paywall immediately
await RevenueCatUI.presentPaywall();

// Present specific offering
await RevenueCatUI.presentPaywall({ offering: myOffering });

// Present only if user lacks entitlement
await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'pro' });
```

### Paywall Component (more control)

```tsx
import RevenueCatUI from 'react-native-purchases-ui';

<RevenueCatUI.Paywall
  onPurchaseCompleted={({ customerInfo }) => {
    // Handle successful purchase
  }}
  onPurchaseError={(error) => {
    // Handle error
  }}
  onDismiss={() => {
    // Paywall closed
  }}
/>
```

### Paywall Event Listeners

- `onPurchaseStarted` - Purchase flow initiated
- `onPurchaseCompleted` - Transaction succeeded
- `onPurchaseError` - Transaction failed
- `onPurchaseCancelled` - User cancelled
- `onRestoreStarted` - Restore initiated
- `onRestoreCompleted` - Restore finished
- `onRestoreError` - Restore failed
- `onDismiss` - Paywall closed

## Making a Purchase

For custom purchase flows (not using pre-built paywalls):

```tsx
import Purchases from 'react-native-purchases';

// Get available packages
const offerings = await Purchases.getOfferings();
const packages = offerings.current?.availablePackages ?? [];

// Purchase a package
const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

// Check if purchase granted entitlement
if (customerInfo.entitlements.active['pro']) {
  // Grant access
}
```

## Checking Subscription Status

```tsx
import Purchases from 'react-native-purchases';

const customerInfo = await Purchases.getCustomerInfo();

// Check specific entitlement
if (customerInfo.entitlements.active['pro'] !== undefined) {
  // User has pro access
}

// Check any active subscription
const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
```

## Reacting to Status Changes

Listen for real-time subscription updates:

```tsx
import Purchases from 'react-native-purchases';
import { useEffect } from 'react';

useEffect(() => {
  const listener = Purchases.addCustomerInfoUpdateListener((info) => {
    // Update UI based on new entitlements
    const isPro = info.entitlements.active['pro'] !== undefined;
    setUserIsPro(isPro);
  });

  return () => {
    listener.remove();
  };
}, []);
```

## RevenueCat MCP for Backend Management

Use the RevenueCat MCP to manage products, offerings, entitlements, and customers. The MCP is pre-connected in Woz agentic environments.

**MCP Use Cases:**
- Create/update products and offerings
- Configure entitlements
- View customer purchase history
- Grant promotional entitlements
- Manage subscription lifecycle

### MCP Token Expiration

IF the RevenueCat MCP fails due to expired tokens:

1. Run `npm run sshbuilder:refresh-integration-tokens`
2. Disable and re-enable the RevenueCat MCP in the agentic environment (Cursor, VSCode, Claude Code, etc.)

### Manual MCP Setup (Last Resort)

If token refresh fails, connect the MCP manually:

**Claude Code:**
```bash
claude mcp add --transport http revenuecat https://mcp.revenuecat.ai/mcp --header "Authorization: Bearer YOUR_API_V2_SECRET_KEY"
```

**Cursor/VSCode (mcp.json):**
```json
{
  "servers": {
    "revenuecat": {
      "url": "https://mcp.revenuecat.ai/mcp",
      "headers": {
        "Authorization": "Bearer {your API v2 token}"
      }
    }
  }
}
```

Get API v2 secret key from RevenueCat Dashboard > API Keys.

Full manual setup guide: https://www.revenuecat.com/docs/tools/mcp/setup

## SDK Version Requirements

- React Native: 8.11.3+
- iOS: 15.0+
- Android: 7.0+

## Quick Reference

| Task | Method |
|------|--------|
| Show paywall | `RevenueCatUI.presentPaywall()` |
| Show if no entitlement | `RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier })` |
| Get offerings | `Purchases.getOfferings()` |
| Purchase package | `Purchases.purchasePackage(package)` |
| Check status | `Purchases.getCustomerInfo()` |
| Listen for changes | `Purchases.addCustomerInfoUpdateListener(callback)` |
| Restore purchases | `Purchases.restorePurchases()` |
| Logout user | `useRevenueCat().logoutUser()` |

## Critical: User Logout Handling

**ALWAYS log out the RevenueCat user when logging out the internal app user.** Failing to do this will cause purchase data to be associated with the wrong user.

Use the `useRevenueCat()` hook to access the logout function:

```tsx
import { useRevenueCat } from '@/comp-lib/integrations/revenue-cat/RevenueCatProviderFunc';

function useLogout() {
  const { logoutUser } = useRevenueCat();

  async function handleLogout() {
    // ALWAYS logout from RevenueCat when logging out the user
    await logoutUser();

    // Then proceed with your app's logout logic (e.g., Supabase signOut)
  }

  return { handleLogout };
}
```

**Important:** Call `logoutUser()` BEFORE signing out from Supabase to ensure proper cleanup.
