import { Route, RouteSegments, UnknownOutputParams } from 'expo-router';

export const PROTOCOL_EXPO = 'exp';
export const PROTOCOL_HTTP = 'http';
export const PROTOCOL_HTTPS = 'https';

/**
 * Extracts a single value from URL parameters
 * @param paramOfInterest - The name of the parameter to extract
 * @param urlParams - The URL parameters object
 * @returns The first value of the parameter if found, otherwise undefined
 */
export function getUrlParamValue(paramOfInterest: string, urlParams: UnknownOutputParams): string | undefined {
  const value = urlParams[paramOfInterest];

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

/**
 * Checks if the current route segment is part of the allowed routes
 * @param currentSegment - The current route segment to check
 * @param allowedSegments - List of allowed route segments to match against
 * @returns True if the current segment matches one of the allowed segments, false otherwise
 */
export function isCurrentRoutePartOfAllowedRoutes(
  currentSegment: RouteSegments<Route>,
  allowedSegments: RouteSegments<Route>[],
): boolean {
  if (allowedSegments.length === 0) return false;
  return allowedSegments.some((route) => {
    return (
      currentSegment.length >= route.length &&
      currentSegment.slice(0, route.length).every((segment, index) => {
        return segment === route[index];
      })
    );
  });
}

/**
 * Converts an Expo URL (with exp+// prefix) to a web URL (with http:// or https:// prefix)
 * @param expoUrl - The URL with exp+// prefix
 * @param useHttps - Optional. If true, uses https:// instead of http://
 * @returns The URL with http:// or https:// prefix, or undefined if input is falsy
 */
export function convertExpoUrlToWebUrl(expoUrl?: string, useHttps?: boolean): string | undefined {
  console.debug('convertExpoUrlToWebUrl', { expoUrl, useHttps });
  if (!expoUrl) {
    return undefined;
  }

  if (expoUrl.startsWith(`${PROTOCOL_EXPO}://`)) {
    const protocol = useHttps ? PROTOCOL_HTTPS : PROTOCOL_HTTP;
    return expoUrl.replace(`${PROTOCOL_EXPO}://`, `${protocol}://`);
  }

  return expoUrl;
}
