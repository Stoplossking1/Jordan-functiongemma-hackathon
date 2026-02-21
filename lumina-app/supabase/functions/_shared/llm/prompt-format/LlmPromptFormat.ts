import { OpenAI } from 'openai';
import { type LlmTokenizer } from '../tokenizer/LlmTokenizer.ts';

export interface LlmPromptFormat {
  countRequestTokens(
    tokenizer: LlmTokenizer,
    messages: Array<OpenAI.ChatCompletionMessageParam>,
    tools?: Array<OpenAI.ChatCompletionTool>,
    toolChoice?: OpenAI.ChatCompletionToolChoiceOption,
  ): number;

  countMessagesTokens(
    tokenizer: LlmTokenizer,
    messages: Array<OpenAI.ChatCompletionMessageParam>,
    haveTools: boolean,
  ): number;
  countMessageTokens(
    tokenizer: LlmTokenizer,
    message: OpenAI.ChatCompletionMessageParam,
    extraContent?: string,
  ): number;
  countToolCallsTokens(tokenizer: LlmTokenizer, toolCalls: Array<OpenAI.ChatCompletionMessageToolCall>): number;
  countToolCallTokens(tokenizer: LlmTokenizer, toolCall: OpenAI.ChatCompletionMessageToolCall): number;
  countToolsTokens(
    tokenizer: LlmTokenizer,
    tools: Array<OpenAI.ChatCompletionTool>,
    toolChoice: OpenAI.ChatCompletionToolChoiceOption,
    haveSystemMessage: boolean,
  ): number;
}
