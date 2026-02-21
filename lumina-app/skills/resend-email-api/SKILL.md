---
name: resend-email-api
description: Use this skill when the user wants to send transactional emails using Resend. Provides integration guidance for email delivery with React templates and tracking.
---

# Resend Email API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Send transactional emails with React templates using Resend's developer-focused email API.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.resend.com`

**Main Endpoints:**
- `/emails` - Send email
- `/emails/{id}` - Get email status
- `/domains` - Manage sending domains

## Environment Variable

- **Variable name:** `RESEND_API_KEY`
- **Used via:** `config.resendApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Domain verification required** - Must verify domain before sending (except to your own email in dev)
2. **From address restrictions** - Must use verified domain; no generic @gmail.com from addresses
3. **React templates supported** - Can send React components as email templates
4. **Rate limits** - Implement queuing for bulk sends to avoid rate limiting
5. **No SMTP** - API-only; no traditional SMTP server access
6. **Attachments size limit** - 40MB total per email
7. **No email validation** - API doesn't validate recipient addresses; bounces counted against quota

## Response Structure

```typescript
// Send email response
interface SendEmailResponse {
  id: string;  // Email ID for tracking
}

// Get email status
interface EmailStatus {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event: 'sent' | 'delivered' | 'bounced' | 'complained';
}
```

## Example API Call

```bash
# Send plain text email
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@yourdomain.com",
    "to": "user@example.com",
    "subject": "Welcome to Our App",
    "text": "Thanks for signing up!"
  }'

# Send HTML email
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "user@example.com",
    "subject": "Password Reset",
    "html": "<h1>Reset Your Password</h1><p>Click here: <a href="https://app.com/reset?token=abc">Reset</a></p>"
  }'

# Get email status
curl "https://api.resend.com/emails/email_abc123" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## React Email Templates

```typescript
// In edge function
import { Resend } from 'resend';

const resend = new Resend(config.resendApiKey);

await resend.emails.send({
  from: 'onboarding@yourdomain.com',
  to: email,
  subject: 'Welcome!',
  react: WelcomeEmail({ userName: 'John' }),
});

// WelcomeEmail.tsx (React component)
export function WelcomeEmail({ userName }: { userName: string }) {
  return (
    <html>
      <body>
        <h1>Welcome, {userName}!</h1>
        <p>We're excited to have you.</p>
      </body>
    </html>
  );
}
```

## Use Cases

- **Transactional emails** - Password resets, order confirmations, receipts
- **Onboarding emails** - Welcome series, account verification
- **Notifications** - Account alerts, security notifications
- **Marketing (limited)** - Announcements, newsletters (respect CAN-SPAM)

## Domain Setup

1. Add domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for verification (usually < 1 hour)
4. Use verified domain in `from` field

## Best Practices

1. **Use descriptive from names** - "YourApp Team <noreply@yourdomain.com>"
2. **Include unsubscribe link** - Required for marketing emails
3. **Handle bounces** - Check email status, remove bounced addresses
4. **Rate limit bulk sends** - Queue emails to stay under rate limits
5. **Test in dev** - Use your own email address before domain verification

## Edge Function Integration

```typescript
// supabase/functions/send-email/index.ts
import { serveFunction, okResponse, errorResponse } from '../_shared/server/func-server.ts';
import { config } from '../_shared/config.ts';
import { Resend } from 'resend';

const resend = new Resend(config.resendApiKey);

serveFunction(false, async (req, claims) => {
  const { to, subject, html } = await req.json();

  const { data, error } = await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  });

  if (error) return errorResponse(error.message, 500);
  return okResponse(data);
});
```

## Alternative Recommendations

- **SendGrid** - More features, higher volume
- **Postmark** - Excellent deliverability, higher cost
- **AWS SES** - Cheapest for high volume, more complex setup

Use Resend when:
- Developer-friendly API preferred
- React templates beneficial
- Moderate email volume
- Simple, modern interface desired

---

**For complete implementation patterns (edge functions, CORS, email templates, error handling):**
→ See the `integration-patterns` skill

