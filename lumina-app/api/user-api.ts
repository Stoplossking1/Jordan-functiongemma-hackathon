import { userEdgeAction, UserEdgeActions } from '@shared/user-func-config';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { updateFunctionsErrorMessage } from '@shared/api-client/edge-function-client';

export async function checkWaitlistedStatus(supabase: SupabaseClient): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Return true if user exists and hasn't been onboarded
    return user != null && !user.user_metadata?.waitlisted;
  } catch (error) {
    console.error('Error checking waitlisted status:', error);
    return false;
  }
}

/**
 * Updates the metadata of the currently authenticated user
 * @param supabase The Supabase client
 * @param data The metadata to update
 * @throws Error if no user is authenticated
 */
export async function updateCurrentUserData(supabase: SupabaseClient, data: Record<string, any>): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  await supabase.auth.updateUser({
    data: {
      ...data,
      waitlisted: true,
    },
  });
}

/**
 * Updates the password of the currently authenticated user
 * @param supabase The Supabase client
 * @param password The new password
 * @returns An object containing the error (if any) and the updated user
 */
export async function updateCurrentUserPassword(
  supabase: SupabaseClient,
  password: string,
): Promise<{ error: Error | null; user: any }> {
  const res = await supabase.auth.updateUser({
    password,
  });

  return { error: res.error, user: res.data.user };
}

/**
 * Updates the email of the currently authenticated user
 * @param supabase The Supabase client
 * @param email The new email
 * @returns The user or throws an error if the update fails
 */
export async function updateCurrentUserEmail(supabase: SupabaseClient, email: string): Promise<User> {
  const res = await supabase.auth.updateUser({
    email,
  });
  if (res.error) {
    const errorMessage = `Failed to update user email: ${res.error}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const user = res.data.user;
  if (!user) {
    const errorMessage = 'Failed to get result from update user email';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return user;
}

/**
 * Calls the delete-user edge function to delete the current user.
 */
export async function deleteCurrentUser(supabaseClient: SupabaseClient): Promise<void> {
  const { error } = await supabaseClient.functions.invoke<void>(userEdgeAction(UserEdgeActions.DELETE_USER), {
    method: 'POST',
  });

  if (error) {
    await updateFunctionsErrorMessage(error);
    throw error;
  }

  console.info('User deleted successfully');
}
