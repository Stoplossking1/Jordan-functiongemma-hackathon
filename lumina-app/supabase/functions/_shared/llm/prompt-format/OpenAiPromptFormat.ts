import { OpenAI } from 'openai';
import { type LlmPromptFormat } from './LlmPromptFormat.ts';
import { type LlmTokenizer } from '../tokenizer/LlmTokenizer.ts';

import * as StringUtils from '../../../_shared-client/utils/string-utils.ts';

export interface OpenAiTokenizerConfig {
  extraRequestTokens: number;
  extraMessageTokens: number;
  extraRoleNameTokens: number;
}

//   tikTokenModelName: 'gpt-4',
const defaultTokenizerConfig: OpenAiTokenizerConfig = {
  extraRequestTokens: 3, // every reply is primed with <|im_start|>assistant<|im_message|>{content}
  extraMessageTokens: 3, // every message follows <|im_start|>{role/name}<|im_sep|>{content}<|im_end|> (role tokens are counted regularly)
  extraRoleNameTokens: 1,
};

export class OpenAiPromptFormat implements LlmPromptFormat {
  constructor(private tokenizerConfig: OpenAiTokenizerConfig = defaultTokenizerConfig) {}

  // TODO: Add support for counting tools and functions, see here https://github.com/hmarr/openai-chat-tokens
  // https://community.openai.com/t/how-to-calculate-the-tokens-when-using-function-call/266573/27
  // https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
  // https://tiktokenizer.vercel.app/
  public countRequestTokens(
    tokenizer: LlmTokenizer,
    messages: Array<OpenAI.ChatCompletionMessageParam>,
    tools?: Array<OpenAI.ChatCompletionTool>,
    toolChoice?: OpenAI.ChatCompletionToolChoiceOption,
  ): number {
    let haveSystemMessage = false;
    for (const message of messages) {
      if (message.role === 'system') {
        haveSystemMessage = true;
        break;
      }
    }
    let tokenCount = this.countMessagesTokens(tokenizer, messages, tools != null);
    tokenCount += tools ? this.countToolsTokens(tokenizer, tools, toolChoice, haveSystemMessage) : 0;
    tokenCount += this.tokenizerConfig.extraRequestTokens;
    return tokenCount;
  }

  public countMessagesTokens(
    tokenizer: LlmTokenizer,
    messages: Array<OpenAI.ChatCompletionMessageParam>,
    haveTools = false,
  ): number {
    let tokenCount = 0;

    // It appears that if functions are present, the first system message is padded with a trailing newline. This
    // was inferred by trying lots of combinations of messages and functions and seeing what the token counts were.
    let oneTimeSystemContent = haveTools ? '\n' : undefined;
    for (const message of messages) {
      const extraContent = message.role === 'system' ? oneTimeSystemContent : undefined;
      tokenCount += this.countMessageTokens(tokenizer, message, extraContent);
      if (extraContent) {
        oneTimeSystemContent = undefined;
      }
    }
    return tokenCount;
  }

  public countMessageTokens(
    tokenizer: LlmTokenizer,
    message: OpenAI.ChatCompletionMessageParam,
    extraContent?: string,
  ): number {
    let tokenCount = this.tokenizerConfig.extraMessageTokens;
    const roleTokenCount = tokenizer.countTextTokens(message.role);
    tokenCount += roleTokenCount;
    if (message.role !== 'tool' && message.name != null) {
      tokenCount += tokenizer.countTextTokens(message.name);
      tokenCount += this.tokenizerConfig.extraRoleNameTokens;
    }
    if (message.role === 'assistant' && message.tool_calls) {
      tokenCount += this.countToolCallsTokens(tokenizer, message.tool_calls);
    }

    //  confirmed that "tool_call_id" is not used for token counting

    // if (message.role == 'tool' && message.tool_call_id) {
    //    tokenCount += this.countTextTokens(message.tool_call_id);
    // }

    const content = StringUtils.asString(message.content);
    const messageTokenCount = content ? tokenizer.countTextTokens(extraContent ? content + extraContent : content) : 0;
    tokenCount += messageTokenCount;
    return tokenCount;
  }

  public countToolCallsTokens(tokenizer: LlmTokenizer, toolCalls: Array<OpenAI.ChatCompletionMessageToolCall>): number {
    let tokenCount = 0;
    tokenCount += 2; // add 2 tokens possibly to indicate the array?
    if (toolCalls.length > 1) {
      tokenCount += 19; // whenever there's >1 tool calls, an extra 19 tokens was used
    }
    for (const toolCall of toolCalls) {
      tokenCount += this.countToolCallTokens(tokenizer, toolCall);
    }
    return tokenCount;
  }

  public countToolCallTokens(tokenizer: LlmTokenizer, toolCall: OpenAI.ChatCompletionMessageToolCall): number {
    let tokenCount = 0;
    // confirmed that "toolCall.id" and "toolCall.type" is not used for token counting
    //tokenCount += this.countTextTokens();
    //tokenCount += this.countTextTokens();

    if (toolCall.type === 'function') {
      tokenCount += 6; // add 6 tokens per message, possibly to mark each name and arguments?
      tokenCount += tokenizer.countTextTokens(toolCall.function.name); // confirmed used for counting
      tokenCount += tokenizer.countTextTokens(toolCall.function.arguments); // confirmed used for counting

      // Argument, e.g.'{"weight": "140", "test": "ab", "test2": "bd", "test3": "ab", "test4": "bd"}'
      // seem to be counted like this: 'weight="140", test="ab", test2="bd", test3="ab", test4="bd",'
      // TODO: sometimes there's no space between the json keys and values. We should account for this
      // e.g. it might look like this: '{"weight":140,"test":"ab","test2":"bd","test3":"ab","test4":"bd"'}
      const argumentCount = StringUtils.countOccurences(toolCall.function.arguments, ': ');
      tokenCount -= argumentCount * 2; // remove two tokens per argument to account for the removed quotes
    } else {
      console.warn(`TODO: tool.type "${toolCall.type}" not properly counted yet`);
    }
    return tokenCount;
  }

  public countToolsTokens(
    tokenizer: LlmTokenizer,
    tools: Array<OpenAI.ChatCompletionTool>,
    toolChoice: OpenAI.ChatCompletionToolChoiceOption = 'auto',
    haveSystemMessage: boolean,
  ): number {
    let tokenCount = 0;

    // If function_call is 'none', add one token.
    // If it's a FunctionCall object, add 4 + the number of tokens in the function name.
    // If it's undefined or 'auto', don't add anything.
    if (toolChoice === 'none') {
      tokenCount += tokenizer.countTextTokens(toolChoice); // token length of "none" is 1
    } else if (
      toolChoice !== 'auto' &&
      toolChoice !== 'required' &&
      toolChoice.type === 'function' &&
      toolChoice.function?.name
    ) {
      //tokenCount += this.countTextTokens(toolChoice.type ?? 'function');
      tokenCount += 4;
      tokenCount += tokenizer.countTextTokens(toolChoice.function?.name);
    }

    tokenCount += 9; // Add 9 tokens per completion
    // If there's a system message _and_ functions are present, subtract four tokens. I assume this is because
    // functions typically add a system message, but reuse the first one if it's already there. This offsets
    // the extra 9 tokens added by the function definitions.
    if (haveSystemMessage) {
      tokenCount -= 4;
    }

    const formatted = formatTools(tools);
    //logger.debug(formatted);
    tokenCount += tokenizer.countTextTokens(formatted);

    // for (const tool of tools) {
    //     tokenCount += this.countToolTokens(tool);
    // }
    return tokenCount;
  }
}

// public countToolTokens(tool: OpenAI.ChatCompletionTool): number {
//     const tokenizer = this.tokenizer;
//     // TODO: add code to count tool parameters
//     let tokenCount = this.tokenizer.encode(tool.type).length;
//     let x: OpenAI.FunctionDefinition = tool.function;

//     return tokenCount;
// }

// https://github.com/hmarr/openai-chat-tokens/blob/main/src/functions.ts

interface ObjectProp {
  type: 'object';
  properties?: Record<string, Prop>;
  required?: Array<string>;
}

interface AnyOfProp {
  anyOf: Array<Prop>;
}

type Prop = {
  description?: string;
} & (
  | AnyOfProp
  | ObjectProp
  | {
      type: 'string';
      enum?: Array<string>;
    }
  | {
      type: 'number' | 'integer';
      minimum?: number;
      maximum?: number;
      enum?: Array<number>;
    }
  | { type: 'boolean' }
  | { type: 'null' }
  | {
      type: 'array';
      items?: Prop;
    }
);

function isAnyOfProp(prop: Prop): prop is AnyOfProp {
  return (prop as AnyOfProp).anyOf !== undefined && Array.isArray((prop as AnyOfProp).anyOf);
}

// When OpenAI use functions in the prompt, they format them as TypeScript definitions rather than OpenAPI JSON schemas.
// This function converts the JSON schemas into TypeScript definitions.
// Example of how https://community.openai.com/t/function-calling-parameter-types/268564/8
function formatTools(tools: Array<OpenAI.ChatCompletionTool>): string {
  const lines = ['namespace functions {', ''];

  for (const tool of tools) {
    // todo: what are we doing with the tool.type? Do we need to print it so it gets counted?
    if (tool.type === 'function') {
      const f = tool.function;
      if (f.description) {
        lines.push(`// ${f.description}`);
      }
      if (f.parameters && Object.keys(f.parameters.properties ?? {}).length > 0) {
        lines.push(`type ${f.name} = (_: {`);
        lines.push(formatObjectProperties(f.parameters as unknown as ObjectProp, 0));
        lines.push('}) => any;');
      } else {
        lines.push(`type ${f.name} = () => any;`);
      }
      lines.push('');
    }
  }
  lines.push('} // namespace functions');
  return lines.join('\n');
}

// Format just the properties of an object (not including the surrounding braces)
function formatObjectProperties(obj: ObjectProp, indent: number): string {
  const lines = [];
  const entries = Object.entries(obj.properties ?? {});
  // const lastEntryIdx = entries.length - 1;
  // let i = 0;
  for (const [name, param] of entries) {
    //const sepChar = i < lastEntryIdx ? ',' : '';
    const sepChar = '';
    if (param.description && indent < 2) {
      lines.push(`// ${param.description}`);
    }
    const optionalChar = obj.required?.includes(name) ? '' : '?';
    lines.push(`${name}${optionalChar}: ${formatType(param, indent)}${sepChar}`);
    // i++;
  }
  return lines.map((line) => ' '.repeat(indent) + line).join('\n');
}

// Format a single property type
function formatType(param: Prop, indent: number): string {
  if (isAnyOfProp(param)) {
    return param.anyOf.map((v) => formatType(v, indent)).join(' | ');
  }
  switch (param.type) {
    case 'string':
      if (param.enum) {
        return param.enum.map((v) => `"${v}"`).join(' | ');
      }
      return 'string';
    case 'number':
      if (param.enum) {
        return param.enum.map((v) => `${v}`).join(' | ');
      }
      return 'number';
    case 'integer':
      if (param.enum) {
        return param.enum.map((v) => `${v}`).join(' | ');
      }
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'object':
      return ['{', formatObjectProperties(param, indent + 2), '}'].join('\n');
    case 'array':
      if (param.items) {
        return `${formatType(param.items, indent)}[]`;
      }
      return 'any[]';
    default:
      return '';
  }
}

export const defaultPromptFormat = new OpenAiPromptFormat();
