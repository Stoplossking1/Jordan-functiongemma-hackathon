---
name: grok-chat-api
description: Use this skill when the user wants to add xAI Grok chat capabilities. Provides integration guidance for conversational AI with real-time web search integration.
---

# Grok Chat API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Build conversational AI applications using xAI's Grok API with real-time web search capabilities.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.x.ai/v1`

**Main Endpoint:**
- `/chat/completions` - Chat completion with OpenAI-compatible format

## Environment Variable

- **Variable name:** `GROK_API_KEY`
- **Used via:** `config.grokApiKey`
- **Pricing:** Contact xAI for pricing (beta access)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **OpenAI-compatible format** - Uses same request/response structure as OpenAI Chat API; easy migration
2. **Web search integration** - Automatically searches web for recent info; no extra parameter needed
3. **Beta access required** - Currently requires xAI beta access approval
4. **Rate limits strict** - Lower rate limits than OpenAI during beta; implement exponential backoff
5. **Streaming supported** - Use `stream: true` for real-time responses
6. **Function calling available** - Supports OpenAI-style function calling/tools
7. **System message positioning** - System message must be first in messages array

## Response Structure

```typescript
// Same as OpenAI Chat API
interface GrokChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## Example API Call

```bash
# Basic chat
curl -X POST "https://api.x.ai/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-beta",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant with access to real-time information"
      },
      {
        "role": "user",
        "content": "What are the latest developments in AI?"
      }
    ],
    "temperature": 0.7
  }'

# Streaming response
curl -X POST "https://api.x.ai/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-beta",
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'
```

## Migration from OpenAI

**Change only:**
1. Base URL: `https://api.openai.com/v1` → `https://api.x.ai/v1`
2. API key: `config.openaiApiKey` → `config.grokApiKey`
3. Model name: `gpt-4` → `grok-beta`

**Keep same:**
- Request structure
- Response parsing
- Streaming logic
- Function calling format

---

**For complete implementation patterns (edge functions, CORS, frontend integration, streaming):**
→ See the `integration-patterns` skill

