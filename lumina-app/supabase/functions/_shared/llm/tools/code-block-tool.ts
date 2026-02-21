import { OpenAI } from 'openai';

import { type LlmProvider, type LlmInvocationHandler } from '../LlmProvider.ts';
import { type CodeBlockParserCallback, parseCodeBlocks } from './CodeBlockParser.ts';

export type ValidationErrorLogger<T> = (attempt: number, e: T) => Promise<void>;
const RETRY_DELAY_IN_MILLIS = 10_000;

interface CodeBlockValidationError {
  llmError?: string;
  syntaxError?: string;
  parsingOrValidationError?: string;
}

export async function invokeCodeBlockToolWithFixAttempt<TOOL_RES, INVOKE_RES>(
  request: OpenAI.ChatCompletionCreateParams,
  codeFence: [string, string],
  maxAttempts: number,
  llm: LlmProvider,
  requiresCodeblock: boolean,
  codeBlockProcessor: CodeBlockParserCallback<Promise<TOOL_RES>>,
  codeBlocksCompleted?: (blockResults: TOOL_RES[]) => Promise<INVOKE_RES | undefined>,
  invocationHandler?: LlmInvocationHandler,
  validationErrorLogger?: ValidationErrorLogger<CodeBlockValidationError>,
): Promise<INVOKE_RES | undefined> {
  // set this here so the request contains it in debug logs
  request.model = llm.fullModelName();
  let delayInMillis = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let choiceText: string | null | undefined;
    try {
      if (delayInMillis > 0) {
        console.log('Waiting a bit before retrying');
        await new Promise((resolve) => setTimeout(resolve, delayInMillis));
        delayInMillis = 0;
      }
      const invokeRes = await llm.invokeWithLengthRetry(request, attempt, 0, 3, invocationHandler);
      choiceText = invokeRes.response?.choices?.[0].message.content;

      // console.dir(textRes, { depth: null });
      if (!choiceText) {
        const errorMessage = 'Did not get a choice response';
        console.warn(errorMessage);
        await validationErrorLogger?.(attempt, { llmError: errorMessage });
        // use another attempt
        continue;
      }

      const finishReason = invokeRes.response?.choices?.[0]?.finish_reason;
      if (finishReason !== 'stop') {
        const errorMessage = `Unexpected finishReason: ${finishReason}`;
        console.warn(errorMessage);
        await validationErrorLogger?.(attempt, { llmError: errorMessage });
        // use another attempt
        continue;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`Error invoking model: ${errorMessage}`);
      await validationErrorLogger?.(attempt, { llmError: errorMessage });
      if (
        e instanceof OpenAI.APIConnectionError ||
        e instanceof OpenAI.APIConnectionTimeoutError ||
        e instanceof OpenAI.RateLimitError
      ) {
        delayInMillis = RETRY_DELAY_IN_MILLIS;
        console.log('Experiencing connection issues, waiting a bit before retrying');
      }

      // use another attempt
      continue;
    }

    let errorMessage: string | undefined;
    try {
      const [codeBlockCount, promises] = parseCodeBlocks(choiceText, codeBlockProcessor);
      const res = await Promise.all(promises);
      if (requiresCodeblock && !codeBlockCount) {
        errorMessage = 'Missing required codeblock in your response';
        await validationErrorLogger?.(attempt, { syntaxError: errorMessage });
      } else {
        return await codeBlocksCompleted?.(res);
      }
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(`Error parsing or validating content, attempt: ${attempt}/${maxAttempts}: ${errorMessage}`);
      await validationErrorLogger?.(attempt, { parsingOrValidationError: errorMessage });
    }

    if (errorMessage) {
      // ask the LLM to fix the error, which might have been caused by an invalid format
      request.messages.push(
        {
          role: 'assistant',
          content: choiceText,
        },
        {
          role: 'user',
          content: `Please fix this error and return valid data according to previous instructions:\n${codeFence[0]}\n${errorMessage}\n${codeFence[1]}`,
        },
      );
    }
  }
  console.error(`No attempts left, giving up`);
  return undefined;
}
