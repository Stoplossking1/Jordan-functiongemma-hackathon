export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const regex = /data:([^;]+);/;
  const match = regex.exec(dataUrl);
  return match ? match[1] : 'application/octet-stream';
}

const mimeTypes: Record<string, string> = {
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',

  // Videos
  mp4: 'video/mp4',

  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  m4a: 'audio/mp4',

  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',

  // other
  css: 'text/css',
  html: 'text/html',
  json: 'application/json',
  js: 'application/javascript',
  zip: 'application/zip',
  bundle: 'application/javascript',
  ttf: 'application/font-sfnt',
  otf: 'font/otf',
};

export function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();

  return extension ? (mimeTypes[extension] ?? 'application/octet-stream') : 'application/octet-stream';
}

export function getExtensionFromMimeType(mimeType: string): string | undefined {
  const entry = Object.entries(mimeTypes).find(([_, mime]) => mime === mimeType);
  if (entry) {
    return entry[0];
  }

  // Fallback: try to extract extension from mime type itself
  const lastSlashIndex = mimeType.lastIndexOf('/');
  return lastSlashIndex !== -1 ? mimeType.substring(lastSlashIndex + 1) : undefined;
}
