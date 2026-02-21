import { EmailService } from '../_shared-client/email/EmailService.ts';

const SEND_EMAIL_FROM = Deno.env.get('SB_AUTH_HOOK_SEND_EMAIL_FROM') ?? 'support@withwoz.com';

/**
 * Supabase auth webhook payload structure for send_email hook
 */
export interface SendEmailWebhookPayload {
  user: {
    email: string;
    id: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

/**
 * Handle the send_email auth hook by sending a confirmation email using EmailService
 * @param emailService The email service to use for sending emails
 * @param webhookData The verified webhook payload from Supabase
 */
export async function handleSendEmail(emailService: EmailService, webhookData: SendEmailWebhookPayload): Promise<void> {
  const { user, email_data } = webhookData;
  const { redirect_to, token_hash, email_action_type, site_url } = email_data;

  // Build the confirmation URL
  const recoveryLink = buildRecoveryLink(site_url, token_hash, email_action_type, redirect_to);

  // Determine email subject and content based on the action type
  let subject: string;
  let html: string;

  switch (email_action_type) {
    case 'signup':
      subject = 'Confirm your email address';
      html = `<p>Welcome! Please confirm your email address by clicking the link below:</p><p><a href="${recoveryLink}" target="_blank" rel="noopener noreferrer">Confirm your email</a></p><p>If you didn't sign up for this account, you can safely ignore this email.</p>`;
      break;
    case 'recovery':
      subject = 'Reset your password';
      html = `<p>You requested to reset your password. Click the link below to set a new password:</p><p><a href="${recoveryLink}" target="_blank" rel="noopener noreferrer">Reset your password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
      break;
    case 'email_change':
      subject = 'Confirm your new email address';
      html = `<p>Please confirm your new email address by clicking the link below:</p><p><a href="${recoveryLink}" target="_blank" rel="noopener noreferrer">Confirm new email</a></p><p>If you didn't request this change, you can safely ignore this email.</p>`;
      break;
    case 'magic_link':
      subject = 'Your magic link for sign in';
      html = `<p>Click the link below to sign in:</p><p><a href="${recoveryLink}" target="_blank" rel="noopener noreferrer">Sign in</a></p><p>This link will expire soon for security reasons.</p>`;
      break;
    default:
      subject = 'Email confirmation required';
      html = `<p>Please confirm your email by clicking the link below:</p><p><a href="${recoveryLink}" target="_blank" rel="noopener noreferrer">Confirm email</a></p>`;
      break;
  }

  // Send the email using the ResendEmailService (HTML)
  await emailService.sendEmailHtml({
    from: SEND_EMAIL_FROM,
    to: user.email,
    subject,
    html,
  });

  console.debug(`Send email hook processed successfully for user ${user.id} - action: ${email_action_type}`);
}

function buildRecoveryLink(siteUrl: string, tokenHash: string, type: string, redirectTo?: string): string {
  const url = new URL('/auth/v1/verify', siteUrl);
  /*
   * Critical: Passing tokenHash value to the token_hash query parameter here will result in an error.
   * Use the 'token' query parameter name with the 'token_hash' value instead.
   */
  url.searchParams.set('token', tokenHash);
  url.searchParams.set('type', type);
  if (redirectTo) {
    url.searchParams.set('redirect_to', redirectTo);
  }
  return url.toString();
}
