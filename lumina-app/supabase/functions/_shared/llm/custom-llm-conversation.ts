import { SupabaseClient } from '@supabase/supabase-js';

import type { Database, uuidstr } from '../../_shared-client/generated-db-types.ts';
import type { ConversationContext } from './llm-conversation.ts';
import type { LlmProvider } from './LlmProvider.ts';
import type { LlmProviderSecrets } from './LlmProviderSecrets.ts';
import type { LlmTool, LlmToolContext } from './tools/llm-tools.ts';
import type { LlmRequestCreator } from './tools/tool-invocation.ts';

export interface CustomLlmToolsProps {
  supabaseClient: SupabaseClient<Database>;
  conversationId: uuidstr;
  botPromptName?: string;
}

export interface CustomLlmTools {
  tools?: LlmTool<LlmToolContext, void, boolean>[];
}

export interface CustomLlmSystemPromptProps {
  supabaseClient: SupabaseClient<Database>;
  conversationId: uuidstr;
  botPromptName?: string;
}

export interface CustomLlmSystemPrompt {
  prompt?: string;
}

export interface CustomLlmModelProviderProps {
  supabaseClient: SupabaseClient<Database>;
  conversationId: uuidstr;
  providerSecrets: LlmProviderSecrets;
  botPromptName?: string;
}

export interface CustomLlmModelProvider {
  provider?: LlmProvider;
}

export interface CustomLlmRequestCreatorProps {
  supabaseClient: SupabaseClient<Database>;
  conversationId: uuidstr;
  botEntityId: uuidstr;
  systemPrompt: string;
  prevMessageId?: uuidstr;
  botPromptName?: string;
  extraContext?: any;
}

export interface CustomLlmRequestCreator {
  creator?: LlmRequestCreator<ConversationContext>;
}
