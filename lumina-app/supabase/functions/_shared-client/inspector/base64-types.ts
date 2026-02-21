import { z } from 'zod';

const base64DataUrlRegex = /^data:[\w-]+\/[\w-]+;base64,[A-Za-z0-9+/]+=*$/;

export const Base64DataSchema = z.object({
  mimeType: z.string(),
  size: z.number().optional(),
  // data URL format with base64 encoding, prefixed with "data:${mimeType};base64,""
  data: z.string().regex(base64DataUrlRegex, 'Invalid base64 data URL format'),
});

export type Base64Data = z.infer<typeof Base64DataSchema>;
