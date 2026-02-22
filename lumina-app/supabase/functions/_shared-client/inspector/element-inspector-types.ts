import { z } from 'zod';

import { Base64DataSchema } from './base64-types.ts';

/*
 * Data about a React stack item in the inspected app.
 * An element from the React fiber will have a stack trace made up of these items up to the root component.
 */
export const ReactElementStackItemSchema = z.object({
  componentName: z.string().optional(),
  source: z.string().optional(),
});

export const SelectedReactElementSchema = z.object({
  stack: z.array(ReactElementStackItemSchema).optional(),
});

/*
 * Data about a React element in the inspected app. Also may contain a screenshot
 */
export const ReactElementDataSchema = SelectedReactElementSchema.extend({
  screenshotImage: z
    .union([
      Base64DataSchema,
      /** @deprecated only kept to not break existing apps, don't use anymore in new apps */
      z.string(), // expects base64 png, prefixed with this "data:image/png;base64,"
    ])
    .optional(),
});

export type ReactElementStackItem = z.infer<typeof ReactElementStackItemSchema>;
export type SelectedReactElement = z.infer<typeof SelectedReactElementSchema>;
export type ReactElementData = z.infer<typeof ReactElementDataSchema>;
