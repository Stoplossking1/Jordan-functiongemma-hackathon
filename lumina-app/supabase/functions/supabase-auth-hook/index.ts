import { JwtPayload } from '@supabase/supabase-js';
import { Webhook } from 'standardwebhooks';

import { type EmailService } from '../_shared-client/email/EmailService.ts';
import { ResendEmailService } from '../_shared-client/email/ResendEmailService.ts';
import {
  SUPABASE_AUTH_HOOK_EDGE_FUNCTION_PATH,
  SupabaseAuthHookActions,
} from '../_shared-client/supabase-auth-hook-func-config.ts';
import { config } from '../_shared/config.ts';
import { parseURL, serveFunction, statusResponse } from '../_shared/server/func-server.ts';
import { handleSendEmail, type SendEmailWebhookPayload } from './supabase-auth-hook-func.ts';

/**
 * Auth hook secrets configuration
 */
interface AuthHookSecrets {
  customAccessToken?: string;
  sendSms?: string;
  sendEmail?: string;
  mfaVerificationAttempt?: string;
  passwordVerificationAttempt?: string;
}

/**
 * Handler function for the supabase auth hook edge function.
 * @param req The request object.
 * @param emailService The email service to use for sending emails.
 * @param authHookSecrets The auth hook secrets configuration.
 * @returns A Response object.
 */
export async function handler(
  req: Request,
  emailService: EmailService,
  authHookSecrets: AuthHookSecrets,
): Promise<Response> {
  if (req.method !== 'POST') {
    return statusResponse(400, 'Only POST method is allowed');
  }

  const [func, action, _id] = parseURL(req.url);

  if (func !== SUPABASE_AUTH_HOOK_EDGE_FUNCTION_PATH) {
    return statusResponse(400, `wrong edge function name: ${func}`);
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    switch (action) {
      case SupabaseAuthHookActions.SEND_EMAIL: {
        if (!authHookSecrets.sendEmail) {
          return statusResponse(500, 'Send email hook secret not configured');
        }

        const wh = new Webhook(authHookSecrets.sendEmail?.replace('v1,whsec_', ''));
        const webhookData = wh.verify(payload, headers) as SendEmailWebhookPayload;

        await handleSendEmail(emailService, webhookData);

        // Critical: Use statusResponse with some message so that the hook responds in the format expected by supabase.
        return statusResponse(200, { message: 'ok' });
      }

      case SupabaseAuthHookActions.CUSTOM_ACCESS_TOKEN: {
        return statusResponse(403, 'Custom access token hook is not implemented yet');
      }

      case SupabaseAuthHookActions.SEND_SMS: {
        return statusResponse(403, 'Send SMS hook is not implemented yet');
      }

      case SupabaseAuthHookActions.MFA_VERIFICATION_ATTEMPT: {
        return statusResponse(403, 'MFA verification attempt hook is not implemented yet');
      }

      case SupabaseAuthHookActions.PASSWORD_VERIFICATION_ATTEMPT: {
        return statusResponse(403, 'Password verification attempt hook is not implemented yet');
      }

      default:
        return statusResponse(404, `unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Auth hook error:', error);
    return statusResponse(500, `Failed to process auth hook: ${error}`);
  }
}

// Supabase Auth Hooks can't require jwt verification because they are triggered by the supabase webhooks.
// Verification of the payload is done per hook action based on the hook secret provided for that action.
serveFunction(false, (req: Request, _claims?: JwtPayload) => {
  // Prepare the email service of choice based on environment config
  let emailService: EmailService;
  try {
    if (config.resendApiKey) {
      emailService = new ResendEmailService(config.resendApiKey);
      console.debug('Resend Email service initialized successfully');
    } else {
      throw new Error(`Failed to initialize email client, no Resend API Key found in the config`);
    }
  } catch (error) {
    throw new Error(`Failed to initialize email client: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Build auth hook secrets config from environment variables
  const authHookSecrets: AuthHookSecrets = {
    customAccessToken: Deno.env.get('SB_AUTH_HOOK_SECRETS_CUSTOM_ACCESS_TOKEN'),
    sendSms: Deno.env.get('SB_AUTH_HOOK_SECRETS_SEND_SMS'),
    sendEmail: Deno.env.get('SB_AUTH_HOOK_SECRETS_SEND_EMAIL'),
    mfaVerificationAttempt: Deno.env.get('SB_AUTH_HOOK_SECRETS_MFA_VERIFICATION_ATTEMPT'),
    passwordVerificationAttempt: Deno.env.get('SB_AUTH_HOOK_SECRETS_PASSWORD_VERIFICATION_ATTEMPT'),
  };

  console.debug('Supabase auth hook function dependencies initialized successfully, ready to serve requests.');

  return handler(req, emailService, authHookSecrets);
});
