import type { ReactElementData } from '@shared/inspector/element-inspector-types';

export const INSPECTOR_MESSAGE_TO_CHANGE_STATUS_REQUEST = 'INSPECTOR_STATUS_CHANGE_REQUEST';
export const INSPECTOR_MESSAGE_FROM_EVENT = 'INSPECTOR_EVENT';

/*
 * Status of the inspector on the "server" (the generated app being inspected).
 * "Clients" (woz-app, woz-native-app, etc.) can represent the inspector status differently, i.e. to handle transitions and loading states.
 */
export type InspectorServerStatus = 'on' | 'off';

/*
 * An event message sent from the inspected app to the inspector client.
 */
export type InspectorEvent = {
  type: typeof INSPECTOR_MESSAGE_FROM_EVENT;
  status: InspectorServerStatus;
  elementData?: ReactElementData;
  timestamp: Date;
};

/*
 * A request message sent from the inspector client to the inspected app to change the inspector status.
 */
export type InspectorStatusChangeRequestEvent = {
  type: typeof INSPECTOR_MESSAGE_TO_CHANGE_STATUS_REQUEST;
  status: InspectorServerStatus;
  timestamp: Date;
};

/*
 * Reads and parses an inspector event message. Returns undefined if the message is invalid.
 */
export function parseInspectorMessage(message: unknown): InspectorEvent | undefined {
  if (!message || typeof message !== 'object' || !('data' in message)) {
    return undefined;
  }

  const maybeEvent = message.data as InspectorEvent;
  if (typeof maybeEvent.status !== 'string') return undefined;
  if (!maybeEvent.timestamp) return undefined;

  if (maybeEvent.elementData === undefined) {
    return maybeEvent;
  }

  return {
    ...maybeEvent,
    timestamp: new Date(maybeEvent.timestamp),
  };
}

/*
 * Reads and parses an inspector status change request message. Returns undefined if the message is invalid.
 */
export function parseInspectorStatusChangeRequestMessage(
  messageData: unknown,
): InspectorStatusChangeRequestEvent | undefined {
  if (
    !messageData ||
    typeof messageData !== 'object' ||
    !('type' in messageData) ||
    messageData.type !== INSPECTOR_MESSAGE_TO_CHANGE_STATUS_REQUEST
  ) {
    return undefined;
  }

  const maybeEvent = messageData as InspectorStatusChangeRequestEvent;
  if (typeof maybeEvent.status !== 'string') return undefined;
  if (!maybeEvent.timestamp) return undefined;

  return {
    ...maybeEvent,
    timestamp: new Date(maybeEvent.timestamp),
  };
}
