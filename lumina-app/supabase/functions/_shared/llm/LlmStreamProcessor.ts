import { OpenAI } from 'openai';
export type GptChatFinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call';

export interface LlmStreamState {
  isStreamOpen: boolean;
  finishReason?: GptChatFinishReason;
  // choice specific
  choiceIndex: number;
  logProbs?: OpenAI.ChatCompletion.Choice.Logprobs;
  fullText?: string;
  refusalText?: string;
  role?: OpenAI.ChatCompletionRole;
  toolCallsCollected: boolean;
}

export type LlmInputStreamProcessor<S> = (
  llmStreamState: LlmStreamState,
  curState?: S,
  newText?: string,
  artificialChunk?: boolean,
) => Promise<S>;

export function makeChoiceFromStreamState(
  streamState: LlmStreamState,
  toolCalls?: Array<OpenAI.ChatCompletionMessageToolCall>,
): OpenAI.ChatCompletion.Choice | undefined {
  if (streamState.role !== 'assistant' || streamState.finishReason == null) {
    return undefined;
  }

  return {
    finish_reason: streamState.finishReason,
    index: 0,
    logprobs: streamState.logProbs ?? null,
    message: {
      content: streamState.fullText ?? null,
      refusal: streamState.refusalText ?? null,
      role: streamState.role,
      tool_calls: toolCalls?.length ? toolCalls : undefined,
    },
  };
}
