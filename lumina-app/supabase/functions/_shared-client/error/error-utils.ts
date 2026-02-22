/**
 * Converts an Error object to a plain JSON object that can be safely serialized
 * via structured clone (postMessage). This prevents DataCloneError when sending
 * RecordedError objects through postMessage.
 *
 * @param error - Error object or any value to convert
 * @returns Plain JSON object with name, message, and stack properties, or the original value if not an Error
 */
export function errorToJson(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    ...(error.stack && { stack: error.stack }),
  };
}
