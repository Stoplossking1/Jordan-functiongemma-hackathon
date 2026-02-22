import { ConversationLlmRoutes } from '../_shared-client/api-schemas/conversation-llm-schema.ts';
import type { ConversationLlmAdapter } from '../_shared/llm/llm-conversation-bot.ts';
import { postMessageToBot } from '../_shared/llm/llm-conversation-bot.ts';
import { createRouter, serveRouter } from '../_shared/server/route-handler.ts';
import { makeClient } from '../_shared/supabaseClient.ts';

import { appPrompt } from './app/appPrompt.ts';
import useCustomLlmModelProvider from './app/useCustomLlmModelProvider.ts';
import useCustomLlmRequestCreator from './app/useCustomLlmRequestCreator.ts';
import useCustomLlmSystemPrompt from './app/useCustomLlmSystemPrompt.ts';
import useCustomLlmTools from './app/useCustomLlmTools.ts';

const conversationLlmAdapter: ConversationLlmAdapter = {
  useCustomLlmModelProvider,
  useCustomLlmRequestCreator,
  useCustomLlmSystemPrompt,
  useCustomLlmTools,
};

const router = createRouter(ConversationLlmRoutes);

router.handle('postMessageToBot', async (ctx) => {
  // // Access JWT claims if needed
  // if (!ctx.claims) {
  //   return ctx.error(401, 'Unauthorized: No valid JWT claims');
  // }

  const supabaseClient = makeClient(ctx.request.headers);
  const { botEntityId, message, attachedAssets, botPromptName, useOutputStream, extraContext } = ctx.body;

  if (!botEntityId) {
    return ctx.error(400, 'Bad Request: "botEntityId" is required');
  }

  const result = await postMessageToBot(supabaseClient, botEntityId, appPrompt, conversationLlmAdapter, {
    message,
    attachedAssets,
    botPromptName,
    useOutputStream,
    extraContext,
  });

  return ctx.ok(result);
});

serveRouter(router, { verifyJwt: true });
