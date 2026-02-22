import { SupabaseClient } from '@supabase/supabase-js';
import type {
  EmailHtmlParams,
  EmailTextParams,
  EmailService,
  EmailWithTemplateParams,
} from '../_shared-client/email/EmailService.ts';
import type { Database } from '../_shared-client/generated-db-types.ts';
import { getContentForTemplate } from './email-template-processing.ts';

/**
 * Send an email with Text content.
 *
 * @param emailService The email service to use for sending the actual email.
 * @param textParams The parameters required to send the email with Text content.
 */
export async function sendText(emailService: EmailService, textParams: EmailTextParams): Promise<void> {
  try {
    await emailService.sendEmailText(textParams);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

/**
 * Send an email with Html content.
 *
 * @param emailService The email service to use for sending the actual email.
 * @param htmlParams The parameters required to send the email with Html content.
 */
export async function sendHtml(emailService: EmailService, htmlParams: EmailHtmlParams): Promise<void> {
  try {
    await emailService.sendEmailHtml(htmlParams);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

/**
 * Send an email based on a template with a given name and input data.
 * It first processes the template to get the HTML content, then sends the email with the HTML content.
 *
 * @param supabaseClient The Supabase client with service role permissions
 * @param emailService The email service to use for sending the actual email.
 * @param templateParams The parameters required to send the email with the specified template.
 */
export async function sendWithTemplate(
  supabaseClient: SupabaseClient<Database>,
  emailService: EmailService,
  templateParams: EmailWithTemplateParams,
): Promise<void> {
  try {
    const htmlContent = await getContentForTemplate(
      supabaseClient,
      templateParams.templateName,
      templateParams.templateInput,
    );
    const emailHtmlParams: EmailHtmlParams = {
      to: templateParams.to,
      from: templateParams.from,
      subject: templateParams.subject,
      html: htmlContent,
    };
    await emailService.sendEmailHtml(emailHtmlParams);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
}
