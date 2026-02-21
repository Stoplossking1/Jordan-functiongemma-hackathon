import { Resend } from 'resend';
import type { EmailHtmlParams, EmailService, EmailTextParams } from './EmailService.ts';

export class ResendEmailService implements EmailService {
  private resendClient: Resend;

  constructor(resendApiKey: string) {
    this.resendClient = new Resend(resendApiKey);
  }

  async sendEmailHtml(params: EmailHtmlParams): Promise<void> {
    try {
      await this.resendClient.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject ?? '',
        html: params.html ?? '',
      });
    } catch (error) {
      console.error('Error sending HTML email:', error);
      throw new Error(`Failed to send HTML email: ${error}`);
    }
  }

  async sendEmailText(params: EmailTextParams): Promise<void> {
    try {
      await this.resendClient.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject ?? '',
        text: params.text ?? '',
      });
    } catch (error) {
      console.error('Error sending text email:', error);
      throw new Error(`Failed to send text email: ${error}`);
    }
  }
}
