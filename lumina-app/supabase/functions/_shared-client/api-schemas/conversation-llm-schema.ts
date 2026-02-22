import { z } from 'zod';

import type { ConversationMessageAssetV1, ConversationMessageV1, uuidstr } from '../generated-db-types.ts';
import { type RoutesDefinition, sseStream } from '../api-client/api-schema-types.ts';

const ConversationMessageV1Schema = z.custom<ConversationMessageV1>();

export interface ConversationMessageChunk {
  // the id of the message once it is stored in the database (will usually only happen after the stream is done)
  messageId: uuidstr;
  content: string;
  artificialChunk?: boolean; // is set to true if a chunk was produced from content that wasn't received from upstream
}

export const ConversationLlmRoutes = {
  postMessageToBot: {
    method: ['POST', 'PUT'],
    path: '/conversation-llm/postMessageToBot',
    body: z.object({
      botEntityId: z.custom<uuidstr>(),
      message: ConversationMessageV1Schema.optional(),
      attachedAssets: z.array(z.custom<Partial<ConversationMessageAssetV1>>()).optional(),
      botPromptName: z.string().optional(),
      useOutputStream: z.boolean().optional(),
      extraContext: z.any().optional(),
    }),
    // Use the helper - stream type is embedded in the schema
    returns: z.union([sseStream<ConversationMessageChunk>(), z.array(ConversationMessageV1Schema)]),
  },
} satisfies RoutesDefinition;
