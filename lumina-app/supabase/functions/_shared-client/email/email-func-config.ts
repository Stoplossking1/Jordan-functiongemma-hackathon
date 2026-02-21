/**
 * Declares helpful constants and functions for working with the email edge function.
 */

export const EMAIL_EDGE_FUNCTION_PATH = 'email';

// Possible Actions inside the email edge function
export enum EmailEdgeActions {
  SEND_HTML = 'sendHtml',
  SEND_TEXT = 'sendText',
  SEND_WITH_TEMPLATE = 'sendWithTemplate',
}

// Helper function to create path-action endpoint based on action
export function emailEdgeAction(action: EmailEdgeActions): string {
  return `${EMAIL_EDGE_FUNCTION_PATH}/${action}`;
}
