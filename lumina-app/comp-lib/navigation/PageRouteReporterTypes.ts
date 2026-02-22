export type PageRouteReporterMessageType = 'ROUTE_CHANGE';
export type PageRouteReporterMessage = {
  type: PageRouteReporterMessageType;
  href: string;
  isAuthenticated: boolean; // info if user is logged in included with each route change
  timestamp: number;
  pathname?: string;
  segments?: string[];
};

export function parsePageRouteReporterMessage(eventMessage: MessageEvent): PageRouteReporterMessage {
  if (!eventMessage.data || typeof eventMessage.data !== 'object') throw new Error('Invalid message format');

  const { type, href, isAuthenticated, timestamp, pathname, segments } = eventMessage.data;

  if (type !== 'ROUTE_CHANGE') throw new Error('Invalid message type');
  if (!href) throw new Error('Missing required message field: href');
  if (isAuthenticated == null) console.debug('Missing required message field: isAuthenticated');

  return {
    type,
    href,
    isAuthenticated,
    timestamp,
    pathname,
    segments,
  };
}
