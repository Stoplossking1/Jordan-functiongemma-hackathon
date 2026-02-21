/**
 * Declares helpful constants and functions for working with edge function.
 */
export const PURCHASE_NATIVE_EDGE_FUNCTION_PATH = 'purchase-native';

// Possible Actions inside the edge function
export enum PurchaseNativeEdgeActions {
  APPLE = 'apple',
  GOOGLE = 'google',
}

// Helper function to create path-action endpoint based on action
export function purchaseNativeEdgeAction(action: PurchaseNativeEdgeActions): string {
  return `${PURCHASE_NATIVE_EDGE_FUNCTION_PATH}/${action}`;
}
