import { SupabaseClient } from '@supabase/supabase-js';

import { updateFunctionsErrorMessage } from '@shared/api-client/edge-function-client';
import type { EmailHtmlParams, EmailTextParams, EmailWithTemplateParams } from '@shared/email/EmailService';
import { emailEdgeAction, EmailEdgeActions } from '@shared/email/email-func-config';
import { type Database } from '@shared/generated-db-types';

/**
 * Sends an email with simple text content.
 * @param supabaseClient The Supabase client instance.
 * @param textParams The parameters for the email text to be sent.
 * @throws Error if the email sending fails.
 */
export async function sendEmailText(
  supabaseClient: SupabaseClient<Database>,
  textParams: EmailTextParams,
): Promise<void> {
  const { error } = await supabaseClient.functions.invoke<void>(emailEdgeAction(EmailEdgeActions.SEND_TEXT), {
    method: 'POST',
    body: textParams,
  });

  if (error) {
    await updateFunctionsErrorMessage(error);
    throw error;
  }
}

/**
 * Sends an email with arbitrary html content.
 * @param supabaseClient The Supabase client instance.
 * @param htmlParams The parameters for the email html to be sent.
 * @throws Error if the email sending fails.
 */
export async function sendEmailHtml(
  supabaseClient: SupabaseClient<Database>,
  htmlParams: EmailHtmlParams,
): Promise<void> {
  const { error } = await supabaseClient.functions.invoke<void>(emailEdgeAction(EmailEdgeActions.SEND_HTML), {
    method: 'POST',
    body: htmlParams,
  });

  if (error) {
    await updateFunctionsErrorMessage(error);
    throw error;
  }
}

/**
 * Sends a generic email using a template.
 * @param supabaseClient The Supabase client instance.
 * @param templateParams The parameters for the email to be sent.
 * @throws Error if the email sending fails.
 */
export async function sendEmailWithTemplate(
  supabaseClient: SupabaseClient<Database>,
  templateParams: EmailWithTemplateParams,
): Promise<void> {
  const { error } = await supabaseClient.functions.invoke<void>(emailEdgeAction(EmailEdgeActions.SEND_WITH_TEMPLATE), {
    method: 'POST',
    body: templateParams,
  });

  if (error) {
    await updateFunctionsErrorMessage(error);
    throw error;
  }
}
