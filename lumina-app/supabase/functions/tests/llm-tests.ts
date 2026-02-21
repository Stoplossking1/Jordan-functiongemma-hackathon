import { OpenAI } from 'openai';

import { makeDefaultModelOrThrow } from '../_shared/llm/defaultModel.ts';
import { type LlmInputStreamProcessor } from '../_shared/llm/LlmStreamProcessor.ts';
import { LlmAssetProvider } from '../_shared/llm/LlmAssetProvider.ts';
import { LlmFactory } from '../_shared/llm/LlmFactory.ts';
import { providerSecrets } from '../_shared/llm/LlmProviderSecrets.ts';

import { AnthropicModel, GoogleModel, OpenAiModel } from '../_shared/llm/models.ts';

const assetProvider: LlmAssetProvider | undefined = undefined; //= new SupabaseAssetProvider();

Deno.test.ignore('LLM simple test', async () => {
  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'set-by-provider',
    messages: [
      {
        role: 'user',
        content: 'What is 1+1?',
      },
    ],
    stream: false,
    temperature: 0,
  };

  // const factory = await LlmFactory.make(providerSecrets);
  // const llm = factory.makeModelProvider(GoogleModel.get('gemini-2.0-flash-lite'));
  // const llm = factory.makeModelProvider(AnthropicModel.getBedrock('claude-sonnet-3.7'));
  const llm = await makeDefaultModelOrThrow(providerSecrets);
  if (llm) {
    try {
      const textRes = await llm.invoke(request, assetProvider);
      console.dir(textRes, { depth: null });
    } catch (e) {
      console.log(e);
    }
  }
});

// test that a previous assistant message can be continued
Deno.test.ignore('Test continuation', async () => {
  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'set-by-provider',
    messages: [
      // {
      //   role: 'user',
      //   content: 'What is 1+1?',
      // },
      {
        role: 'assistant',
        content: 'The answer is 2. Let me also give you the answer for 2+2. It is',
      },
    ],
    stream: false,
    temperature: 0,
  };

  const factory = await LlmFactory.make(providerSecrets);
  const llm = factory.makeModelProvider(AnthropicModel.getBedrock('claude-sonnet-3.5-v2'));
  if (llm) {
    const textRes = await llm.invoke(request, assetProvider);
    console.dir(textRes, { depth: null });
  }
});

// test that a previous assistant message can be continued
Deno.test.ignore('Test continuation', async () => {
  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'set-by-provider',
    messages: [
      // {
      //   role: 'user',
      //   content: 'What is 1+1?',
      // },
      {
        role: 'assistant',
        content: 'The answer is 2. Let me also give you the answer for 2+2. It is',
      },
    ],
    stream: false,
    temperature: 0,
  };

  const factory = await LlmFactory.make(providerSecrets);
  const llm = factory.makeModelProvider(AnthropicModel.getBedrock('claude-sonnet-3.5-v2'));
  if (llm) {
    const textRes = await llm.invoke(request, assetProvider);
    console.dir(textRes, { depth: null });
  }
});

Deno.test.ignore('LLM test reasoning', async () => {
  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'set-by-provider',
    messages: [
      { role: 'developer', content: 'pretent to be a math tutor' },
      {
        role: 'user',
        content: 'What is 1+1?',
      },
    ],
    stream: false,
    temperature: 0,
  };

  try {
    const factory = await LlmFactory.make(providerSecrets);
    const llm = factory.makeModelProvider(OpenAiModel.get('o1-mini'));
    // const llm = factory.makeModelProvider(OpenAiModel.get('o3-mini'));
    if (llm) {
      const textRes = await llm.invoke(request, assetProvider);
      console.log(textRes);
    }
  } catch (e) {
    console.log(e);
  }
});

Deno.test.ignore('LLM function call', async () => {
  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'set-by-provider',
    messages: [
      {
        role: 'user',
        content: `Hi, my name is Woz Builder and I live in Palo Alto`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_full_name',
          description: "A person's full name?",
          parameters: {
            type: 'object',
            properties: {
              given_name: {
                type: 'string',
                description: 'A given or first name',
              },
              family_name: {
                type: 'string',
                description: 'A family or last name',
              },
            },
            required: ['given_name', 'family_name'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'extract_city',
          description: 'The name of a city',
          parameters: {
            type: 'object',
            properties: {
              city_name: {
                type: 'string',
                description: 'The name of a city',
              },
            },
            required: ['city_name'],
          },
        },
      },
    ],
    stream: true,
    temperature: 0,
  };

  const streamProcessor: LlmInputStreamProcessor<void> = async (llmStreamState, curState, newText) => {
    console.log(`Llm text: ${newText}`);

    if (!llmStreamState.isStreamOpen) {
      console.log('LLM input is done');
    }
  };

  // const factory = await LlmFactory.make(providerSecrets);
  // const llm = factory.makeModelProvider(GoogleModel.get('gemini-2.0-flash-lite'));
  const llm = await makeDefaultModelOrThrow(providerSecrets);
  if (llm) {
    const textRes = await llm.invoke(request, assetProvider, undefined, streamProcessor);
    console.dir(textRes, { depth: null });
  }
});

Deno.test.ignore('Bedrock function call', async () => {
  // Check if this error is handled:
  // stream processing error: The model returned the following errors: Your API request included an `assistant` message in the final position, which would pre-fill the `assistant` response. When using tools, pre-filling the `assistant` response is not supported.

  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    messages: [
      { content: 'You are a helpful assistant', role: 'system' },
      {
        role: 'assistant',
        content: 'I am a builder bot, how can I help',
      },
      { role: 'user', content: 'Nice to meet you. Do you have a name?' },
      { role: 'assistant', content: 'Yes, my name is Bot the Builder.' },
      { role: 'user', content: 'What can you do for me?' },
      {
        role: 'user',
        content: 'yes, I want users to pay for this service',
      },
      {
        role: 'assistant',
        content:
          'I can help you analyze whether something is a subscription service or not. I can take information about a service or product and help determine if it follows a subscription model, providing a clear yes/no decision with reasoning.\n' +
          '\n' +
          "If you have any service or product you'd like me to evaluate regarding its subscription status, please share the details and I'll help analyze it for you.",
      },
    ],
    tool_choice: 'auto',
    tools: [
      {
        type: 'function',
        function: {
          name: 'subscription_decision_provided',
          description: `User's response to "is this a subscription service?", such as yes/no, agree/disagree, did/did not. Cannot be "maybe"`,
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              subscription_decision: {
                type: 'boolean',
                description: 'decision regarding "subscription"',
              },
            },
            required: ['reason', 'subscription_decision'],
          },
        },
      },
    ],
    parallel_tool_calls: true,
    stream: false,
    temperature: 0,
  };
  const factory = await LlmFactory.make(providerSecrets);
  const llm = factory.makeModelProvider(AnthropicModel.getBedrock('claude-haiku-3'));
  if (llm) {
    const textRes = await llm.invoke(request, assetProvider, undefined, undefined);
    console.dir(textRes, { depth: null });
  }
});

// {
//   model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
//   messages: [
//     { content: "You are a helpful assistant", role: "system" },
//     {
//       role: "assistant",
//       content: "I am a builder bot, how can I help"
//     },
//     { role: "user", content: "Nice to meet you. Do you have a name?" },
//     { role: "assistant", content: "Yes, my name is Bot the Builder." },
//     { role: "user", content: "What can you do for me?" },
//     {
//       role: "user",
//       content: 'If you ask me "is this a subscription service?". My answer is Yes'
//     },
//     {
//       role: "assistant",
//       content: 'Based on your response indicating "Yes" to whether this is a subscription service, I can help process that information using the available tool. Let me record that decision:'
//     },
//     { role: "user", content: "sounds good" }
//   ],
//   tool_choice: "auto",
//   tools: [
//     {
//       type: "function",
//       function: {
//         name: "subscription_decision_provided",
//         description: `User's response to "is this a subscription service?", such as yes/no, agree/disagree, did/did not. Cannot be "maybe"`,
//         parameters: {
//           type: "object",
//           properties: {
//             reason: { type: "string" },
//             subscription_decision: {
//               type: "boolean",
//               description: 'decision regarding "subscription"'
//             }
//           },
//           required: [ "reason", "subscription_decision" ]
//         }
//       }
//     }
//   ],
//   parallel_tool_calls: true,
//   stream: true,
//   temperature: 0
// }

// {
//   model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
//   messages: [
//     { content: "You are a helpful assistant", role: "system" },
//     {
//       role: "assistant",
//       content: "I am a builder bot, how can I help"
//     },
//     { role: "user", content: "Nice to meet you. Do you have a name?" },
//     { role: "assistant", content: "Yes, my name is Bot the Builder." },
//     { role: "user", content: "What can you do for me?" },
//     {
//       role: "user",
//       content: 'If you ask me "is this a subscription service?". My answer is Yes'
//     },
//     {
//       role: "assistant",
//       content: 'Based on your response indicating "Yes" to whether this is a subscription service, I can help process that information using the available tool. Let me record that decision:',
//       refusal: null,
//       tool_calls: [
//         {
//           id: "tooluse_RoIL23C6RQGZ55n5v7Xwmw",
//           type: "function",
//           function: {
//             name: "subscription_decision_provided",
//             arguments: '{"subscription_decision": true, "reason": "User explicitly stated \\"Yes\\" to subscription service question"}'
//           }
//         }
//       ]
//     },
//     {
//       role: "tool",
//       content: "ok",
//       tool_call_id: "tooluse_RoIL23C6RQGZ55n5v7Xwmw"
//     },
//     {
//       role: "assistant",
//       content: 'Based on your response indicating "Yes" to whether this is a subscription service, I can help process that information using the available tool. Let me record that decision:'
//     },
//     { role: "user", content: "sounds good" }
//   ],
//   tool_choice: "auto",
//   tools: [
//     {
//       type: "function",
//       function: {
//         name: "subscription_decision_provided",
//         description: `User's response to "is this a subscription service?", such as yes/no, agree/disagree, did/did not. Cannot be "maybe"`,
//         parameters: {
//           type: "object",
//           properties: {
//             reason: { type: "string" },
//             subscription_decision: {
//               type: "boolean",
//               description: 'decision regarding "subscription"'
//             }
//           },
//           required: [ "reason", "subscription_decision" ]
//         }
//       }
//     }
//   ],
//   parallel_tool_calls: true,
//   stream: true,
//   temperature: 0
// }

Deno.test.ignore('VertexAi function call', async () => {
  // Check if this error is handled:
  // stream processing error: The model returned the following errors: Your API request included an `assistant` message in the final position, which would pre-fill the `assistant` response. When using tools, pre-filling the `assistant` response is not supported.

  const request: OpenAI.ChatCompletionCreateParams = {
    model: 'empty',
    messages: [
      {
        content: 'You are a helpful, friendly assistant.',
        role: 'system',
      },
      {
        role: 'assistant',
        content: 'I am a builder bot, how can I help',
      },
      { role: 'user', content: 'Nice to meet you. Do you have a name?' },
      { role: 'assistant', content: 'Yes, my name is Bot the Builder.' },
      { role: 'user', content: 'What can you do for me?' },
      {
        role: 'user',
        content: 'If you ask me "is this a subscription service?". My answer is Yes',
      },
      {
        content: null,
        refusal: null,
        role: 'assistant',
        tool_calls: [
          {
            id: 'subscription_decision_provided',
            type: 'function',
            function: {
              name: 'subscription_decision_provided',
              arguments: '{"subscription_decision":true,"reason":"User confirmed that it is a subscription service"}',
            },
          },
        ],
      },
      {
        tool_call_id: 'subscription_decision_provided',
        role: 'tool',
        content: 'ok',
      },
    ],
    tool_choice: 'auto',
    tools: [
      {
        type: 'function',
        function: {
          name: 'subscription_decision_provided',
          description: `User's response to "is this a subscription service?", such as yes/no, agree/disagree, did/did not. Cannot be "maybe"`,
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              subscription_decision: {
                type: 'boolean',
                description: 'decision regarding "subscription"',
              },
            },
            required: ['reason', 'subscription_decision'],
          },
        },
      },
    ],
    parallel_tool_calls: true,
    stream: false,
    temperature: 0,
  };
  const factory = await LlmFactory.make(providerSecrets);
  const llm = factory.makeModelProvider(GoogleModel.get('gemini-1.5-flash'));
  if (llm) {
    try {
      const textRes = await llm.invoke(request, assetProvider, undefined, undefined);
      console.dir(textRes, { depth: null });
    } catch (e) {
      console.log(e);
    }
  }
});
