/**
 * Email Processing takes in an email template name and input data, and returns the HTML content of the email.
 *
 * EXTENSIBILITY GUIDE:
 * This module is designed to be extended by applications that need custom email templates.
 * To add new templates:
 * 1. Create your template function in the templates/ directory
 * 2. Import it at the top of this file
 * 3. Add a new condition in getContentForTemplate() to handle your template name
 * 4. Use the supabaseClient parameter to fetch data from your database if needed
 * 5. Use the templateInput parameter to pass dynamic content to your template
 */
import { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../_shared-client/generated-db-types.ts';
import { getGenericEmailTemplate, type EmailTemplateGenericParams } from './templates/email-template-generic.ts';

/**
 * Gets the HTML content for a specified email template with the provided input data.
 *
 * @param supabaseClient The Supabase client with service role permissions - use this to process additional data from your database
 * @param templateName The name of the template to use - add your custom template names here
 * @param templateInput The input data for the template - pass any dynamic content your template needs
 * @returns A Promise that resolves to the HTML content of the email
 *
 * EXTENDING THIS FUNCTION:
 * Add new template conditions following this pattern:
 *
 * if (templateName === 'yourCustomTemplate' && templateInput) {
 *   // Optionally fetch additional data using supabaseClient
 *   const additionalData = await dbDataFetcherUtil(supabaseClient, templateInput.someId);
 *
 *   return getYourCustomTemplate({
 *     ...templateInput as YourTemplateParams,
 *     additionalData
 *   });
 * }
 */
export async function getContentForTemplate(
  supabaseClient: SupabaseClient<Database>,
  templateName: string,
  templateInput: Record<string, unknown>,
): Promise<string> {
  // Handle generic template with custom configuration
  if (templateName === 'genericEmailTemplate' && templateInput) {
    return getGenericEmailTemplate(templateInput as EmailTemplateGenericParams);
  }

  // ADD YOUR CUSTOM TEMPLATES BELOW

  throw new Error(`Unknown email template: ${templateName}. Available templates: genericEmailTemplate`);
}
