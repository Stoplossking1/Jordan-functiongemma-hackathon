const PRODUCTION_ORIGINS = [
  'https://build.withwoz.com',
  'https://woz-app.expo.app',
  'https://woz-app--staging.expo.app',
  'https://woz-app--dev.expo.app',
];

const DEVELOPMENT_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'];

// PR preview origins follow the pattern: https://woz-app--pr-{number}.expo.app
const PR_PREVIEW_ORIGIN_PATTERN = /^https:\/\/woz-app--pr-\d+\.expo\.app$/;

function getAllowedOrigins(): string[] {
  // allow development origins for now for testing (when checking staging iframe app to localhost for testing "editing" and "versionning")
  return [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];
}

export const TARGET_PARENT_ORIGINS = getAllowedOrigins();

// Cache the detected parent origin to avoid repeated postMessage errors
let cachedParentOrigin: string | undefined;

function detectParentOrigin(): string | undefined {
  if (typeof window === 'undefined' || window === window.parent) {
    return undefined;
  }

  // Try to get parent origin from document.referrer
  try {
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer);
      const referrerOrigin = referrerUrl.origin;

      if (isAllowedParentOrigin(referrerOrigin)) {
        return referrerOrigin;
      }
    }
  } catch {
    // Ignore URL parsing errors
  }

  return undefined;
}

export function isAllowedParentOrigin(origin: string): boolean {
  if (TARGET_PARENT_ORIGINS.includes(origin)) {
    return true;
  }
  // Check if it matches PR preview pattern
  return PR_PREVIEW_ORIGIN_PATTERN.test(origin);
}

export function sendMessageToParent(message: object): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Use cached parent origin if available
  if (cachedParentOrigin) {
    try {
      window.parent.postMessage(message, cachedParentOrigin);
      return;
    } catch {
      // Origin might have changed, clear cache and retry
      cachedParentOrigin = undefined;
    }
  }

  // Try to detect parent origin from referrer
  const detectedOrigin = detectParentOrigin();
  if (detectedOrigin) {
    cachedParentOrigin = detectedOrigin;
    try {
      window.parent.postMessage(message, detectedOrigin);
      return;
    } catch {
      cachedParentOrigin = undefined;
    }
  }

  // Fallback: try known origins (will still log errors for mismatches)
  for (const origin of TARGET_PARENT_ORIGINS) {
    try {
      window.parent.postMessage(message, origin);
    } catch (ex) {
      // Ignore errors from invalid origins
    }
  }
}
// Allow setting parent origin when received from a message event
export function setParentOriginFromMessage(origin: string): void {
  if (isAllowedParentOrigin(origin)) {
    cachedParentOrigin = origin;
  }
}
