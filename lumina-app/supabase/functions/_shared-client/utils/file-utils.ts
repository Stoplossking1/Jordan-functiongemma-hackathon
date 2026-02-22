export type FileFormat = 'yaml' | 'json';

export function getContentTypeForFileFormat(format: FileFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'yaml':
      return 'application/x-yaml';
    default:
      throw new Error(`Unsupported file format: ${format}`);
  }
}
