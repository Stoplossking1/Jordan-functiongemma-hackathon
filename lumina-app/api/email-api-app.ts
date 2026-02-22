import { SupabaseClient } from '@supabase/supabase-js';

import { type Database } from '@shared/generated-db-types';
import { sendEmailText } from './email-api';

/**
 * App-specific email. Add more emails to this function as needed.
 */
export async function sendWelcomeEmail(supabaseClient: SupabaseClient<Database>, from: string): Promise<void> {
  // Get email of the user
  const {
    data: { user },
    error: sessionError,
  } = await supabaseClient.auth.getUser();
  if (!user?.email || sessionError) {
    throw new Error(
      `Failed to get current user email. ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`,
    );
  }

  // Build the email parameters
  const emailParams = {
    from: from,
    to: user.email,
    subject: 'Thank you for signing up!',
    text: 'Welcome to our service!',
  };

  try {
    await sendEmailText(supabaseClient, emailParams);
  } catch (ex) {
    console.error('Error sending email:', ex);
    throw new Error(`Failed to send email: ${ex}`);
  }
}

// Add more app-specific email functions here as needed
