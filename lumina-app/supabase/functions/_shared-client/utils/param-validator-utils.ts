import type { uuidstr } from '../generated-db-types.ts';
import { isUuid } from './conversion-utils.ts';
import type { FileFormat } from './file-utils.ts';

export function validateUuidParam(uuidParam?: uuidstr | null): uuidstr {
  if (!uuidParam) {
    throw new Error('uuid param is required');
  }
  if (!isUuid(uuidParam)) {
    throw new Error('Invalid uuid param format, must be a UUID');
  }

  return uuidParam;
}

/**
 * Validate the projectId parameter
 * @param projectIdParam The projectId parameter
 * @returns The projectId
 * @throws
 * - Error if the projectId is invalid
 * - Error if the projectId is not provided
 */
export function validateProjectIdParam(projectIdParam?: uuidstr | null): uuidstr {
  if (!projectIdParam) {
    throw new Error('projectId is required');
  }
  if (!isUuid(projectIdParam)) {
    throw new Error('Invalid projectId format, must be a UUID');
  }

  return projectIdParam;
}

/**
 * Validate the return format parameter
 * @param formatParam The format parameter
 * @returns The type-safe file format
 * @throws
 * - Error if the format is invalid
 * - Error if the format is not provided
 */
export function validateFormatParam(formatParam?: string | null): FileFormat {
  // Default to YAML if no format is provided
  if (!formatParam) {
    return 'yaml' satisfies FileFormat;
  }

  const formatParamLower = formatParam.toLowerCase();

  // Validate format
  if (!isValidFileFormat(formatParamLower)) {
    throw new Error('format must be either "yaml" or "json", but was given: ' + formatParam);
  }

  return formatParamLower;
}

/**
 * Check if the value is a valid file format
 * @param value The value to check
 * @returns true if the value is a valid file format, false otherwise
 */
// A type guard function that validates if a string is a FileFormat
export function isValidFileFormat(format: string): format is FileFormat {
  return format === 'yaml' || format === 'json';
}
