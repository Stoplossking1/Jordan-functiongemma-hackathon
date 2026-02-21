import {
  type AuthError,
  type AuthOtpResponse,
  type AuthResponse,
  type AuthTokenResponse,
  OAuthResponse,
  SupabaseClient,
} from '@supabase/supabase-js';
import { AppleAuthenticationScope, signInAsync } from 'expo-apple-authentication';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

export type EmptyObjectResponse =
  | {
      data: {};
      error: null;
    }
  | { data: null; error: AuthError };

export type NullResponse = {
  error: AuthError | null;
};

export async function setAutoRefresh(enabled: boolean, supabaseClient: SupabaseClient): Promise<void> {
  if (enabled) {
    await supabaseClient.auth.startAutoRefresh();
  } else {
    await supabaseClient.auth.stopAutoRefresh();
  }
}

export async function signUpWithEmailPassword(
  supabaseClient: SupabaseClient,
  email: string,
  password: string,
  userMetadata?: Record<string, any>,
  redirectTo?: string,
): Promise<AuthResponse> {
  return supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      ...(redirectTo && { emailRedirectTo: redirectTo }),
    },
  });
}

export async function resendVerificationEmail(supabaseClient: SupabaseClient, email: string): Promise<AuthOtpResponse> {
  return supabaseClient.auth.resend({
    type: 'signup',
    email,
  });
}

export async function signInWithEmailPassword(
  supabaseClient: SupabaseClient,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Initiates the auth flow for the native Apple Sign In.
 * Returns the token and nonce that will later be passed
 * to Supabase to complete the sign in.
 */
async function initiateAppleSignIn(): Promise<{ token: string; nonce: string }> {
  const rawNonce = randomUUID();
  const hashedNonce = await digestStringAsync(CryptoDigestAlgorithm.SHA256, rawNonce);

  const credential = await signInAsync({
    requestedScopes: [AppleAuthenticationScope.FULL_NAME, AppleAuthenticationScope.EMAIL],
    nonce: hashedNonce,
  });

  const token = credential.identityToken;
  if (!token) throw new Error('No id token');

  return { token, nonce: rawNonce };
}

export async function signInWithApple(supabaseClient: SupabaseClient): Promise<AuthTokenResponse> {
  const { token, nonce } = await initiateAppleSignIn();
  return await supabaseClient.auth.signInWithIdToken({
    provider: 'apple',
    token,
    nonce,
  });
}

export async function signOut(supabaseClient: SupabaseClient): Promise<NullResponse> {
  return supabaseClient.auth.signOut();
}

export async function resetPasswordForEmail(
  supabaseClient: SupabaseClient,
  email: string,
  redirectTo?: string,
): Promise<EmptyObjectResponse> {
  return await supabaseClient.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
}

export async function signInWithGoogleOAuthWeb(
  supabaseClient: SupabaseClient,
  redirectTo?: string,
): Promise<OAuthResponse> {
  return supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}

export async function signInWithAppleOAuthWeb(
  supabaseClient: SupabaseClient,
  redirectTo?: string,
): Promise<OAuthResponse> {
  return supabaseClient.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo,
    },
  });
}

/**
 * Checks if the currently authenticated user is an internal user based on their email address.
 * @param email The email address of the user.
 * @returns True if the user is an internal user, false otherwise.
 */
export async function isInternalUser(supabaseClient: SupabaseClient, internalUserDomains: string[]): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
    return false;
  }

  if (!user?.email) {
    return false;
  }

  // Check if the user's email ends with any of the internal user domains
  for (const domain of internalUserDomains) {
    if (user.email.endsWith('@' + domain)) {
      return true;
    }
  }

  // If no internal domain matches, return false
  return false;
}
