/**
 * Interface representing the parameters required to send an email.
 */
export interface EmailParams {
  from: string;
  to: string;
  subject?: string;
}

/**
 * Interface representing the parameters required to send an email with HTML content.
 */
export interface EmailHtmlParams extends EmailParams {
  html: string;
}

/**
 * Interface representing the parameters required to send an email with plain text content.
 */
export interface EmailTextParams extends EmailParams {
  text: string;
}

/**
 * Generic type representing Email Template Input Parameters.
 */
export type EmailTemplateInputParams = Record<string, unknown>;

/**
 * Interface representing the parameters required to send an email with a template.
 */
export interface EmailWithTemplateParams extends EmailParams {
  templateName: string;
  templateInput: EmailTemplateInputParams;
}

/**
 * A generic EmailService interface that defines methods for sending an email.
 */
export interface EmailService {
  sendEmailHtml(params: EmailHtmlParams): Promise<void>;
  sendEmailText(params: EmailTextParams): Promise<void>;
}
