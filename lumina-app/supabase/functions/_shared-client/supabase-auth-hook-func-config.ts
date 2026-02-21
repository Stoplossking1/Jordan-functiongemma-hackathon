/**
 * Declares helpful constants and functions for working with supabase auth hook edge function.
 */
export const SUPABASE_AUTH_HOOK_EDGE_FUNCTION_PATH = 'supabase-auth-hook';

// Possible Hook Actions inside the edge function
export enum SupabaseAuthHookActions {
  CUSTOM_ACCESS_TOKEN = 'custom-access-token',
  SEND_SMS = 'send-sms',
  SEND_EMAIL = 'send-email',
  MFA_VERIFICATION_ATTEMPT = 'mfa-verification-attempt',
  PASSWORD_VERIFICATION_ATTEMPT = 'password-verification-attempt',
}

// Helper function to create path-action endpoint based on action
export function supabaseAuthHookAction(action: SupabaseAuthHookActions): string {
  return `${SUPABASE_AUTH_HOOK_EDGE_FUNCTION_PATH}/${action}`;
}
