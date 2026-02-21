import { z } from 'zod';

export type NestedStringRecord = {
  [key: string]: string | NestedStringRecord;
}

// Create Zod schema that validates this exact type
export const TranslationSchema: z.ZodType<NestedStringRecord> = z.lazy(() =>
  z.record(
    z.string(),
    z.union([z.string(), TranslationSchema])
  )
);

// Translation is equivalent to NestedStringRecord
export type Translation = z.infer<typeof TranslationSchema>;