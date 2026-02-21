import { createClient, JwtPayload } from '@supabase/supabase-js';

import { EMAIL_EDGE_FUNCTION_PATH, EmailEdgeActions } from '../_shared-client/email/email-func-config.ts';
import { EmailService } from '../_shared-client/email/EmailService.ts';
import { ResendEmailService } from '../_shared-client/email/ResendEmailService.ts';
import type { Database } from '../_shared-client/generated-db-types.ts';
import { config } from '../_shared/config.ts';
import { okResponse, parseURL, serveFunction, statusResponse } from '../_shared/server/func-server.ts';
import { sendHtml, sendText, sendWithTemplate } from './email-func.ts';

/**
 * Handler function for the email edge function.
 * @param req The request object.
 * @param supabaseClient The Supabase client with service role permissions.
 * @param emailService The email service to use for sending emails.
 * @returns A Response object.
 */
export async function handler(
  req: Request,
  supabaseClient: ReturnType<typeof createClient<Database>>,
  emailService: EmailService,
): Promise<Response> {
  const [func, action, _id] = parseURL(req.url);

  if (func !== EMAIL_EDGE_FUNCTION_PATH) {
    return statusResponse(400, `wrong edge function name: ${func}`);
  }

  switch (action) {
    case EmailEdgeActions.SEND_HTML: {
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          await sendHtml(emailService, await req.json());
          return okResponse('Email sent successfully');
        } catch (ex) {
          return statusResponse(500, `Failed to send email: ${ex}`);
        }
      }
      break;
    }
    case EmailEdgeActions.SEND_TEXT: {
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          await sendText(emailService, await req.json());
          return okResponse('Email sent successfully');
        } catch (ex) {
          return statusResponse(500, `Failed to send email: ${ex}`);
        }
      }
      break;
    }
    case EmailEdgeActions.SEND_WITH_TEMPLATE: {
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          console.debug('Sending email with template', req.url);
          await sendWithTemplate(supabaseClient, emailService, await req.json());
          return okResponse('Email sent successfully');
        } catch (ex) {
          return statusResponse(500, `Failed to send email: ${ex}`);
        }
      }
      break;
    }
    default:
      break;
  }

  return statusResponse(404, `unknown action: ${action}`);
}

/**
 * Initialize the email service and serve the function handler.
 *
 * This pattern avoids re-initializing the email service on each request,
 * and also separates the handler logic from the initialization logic for better unit testing.
 */
function serve(): void {
  // Create Supabase client with service role permissions
  const supabaseClient = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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
    throw new Error(`Failed to initialize email client: ${error}`);
  }

  console.debug('Email function dependencies initialized successfully, ready to serve requests.');

  // This anonymous function creates a closure by capturing supabaseClient and emailService
  serveFunction(true, (req: Request, _claims?: JwtPayload) => handler(req, supabaseClient, emailService));
}

// Start the server
serve();
