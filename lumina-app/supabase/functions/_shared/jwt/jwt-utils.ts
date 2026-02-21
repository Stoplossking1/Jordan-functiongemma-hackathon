import { createRemoteJWKSet, JWTPayload, jwtVerify, JWTVerifyGetKey } from 'jose';

const SUPABASE_JWKS_URL_PATH = 'auth/v1/.well-known/jwks.json';

/**
 * Creates a JWKS verifier for a Supabase Cloud project.
 */
export function getSupabaseJwks(projectRef: string): JWTVerifyGetKey {
  const JWKS_URL = `https://${projectRef}.supabase.co/${SUPABASE_JWKS_URL_PATH}`;
  const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  return JWKS;
}

/**
 * Authenticates a Supabase JWT token using the project reference.
 * Use this for Supabase Cloud projects.
 */
export async function authenticateSupabaseToken(supabaseToken: string, projectRef: string): Promise<JWTPayload> {
  const JWKS = getSupabaseJwks(projectRef);

  try {
    const { payload } = await jwtVerify(supabaseToken, JWKS);
    return payload;
  } catch (error) {
    console.error('Error validating Supabase JWT:', error);
    throw new Error('Invalid token: The provided authentication token is not valid');
  }
}

/**
 * Creates a JWKS verifier from a base Supabase URL.
 * Use this for local Supabase instances or custom deployments.
 */
export function getSupabaseJwksByUrl(supabaseUrl: string): JWTVerifyGetKey {
  const JWKS_URL = `${supabaseUrl}/${SUPABASE_JWKS_URL_PATH}`;
  const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  return JWKS;
}

/**
 * Authenticates a Supabase JWT token using a custom Supabase URL.
 * Use this for local Supabase instances or custom deployments where
 * the standard cloud URL pattern doesn't apply.
 */
export async function authenticateSupabaseTokenByUrl(supabaseToken: string, supabaseUrl: string): Promise<JWTPayload> {
  const JWKS = getSupabaseJwksByUrl(supabaseUrl);

  try {
    const { payload } = await jwtVerify(supabaseToken, JWKS);
    return payload;
  } catch (error) {
    console.error('Error validating Supabase JWT:', error);
    throw new Error('Invalid token: The provided authentication token is not valid');
  }
}
