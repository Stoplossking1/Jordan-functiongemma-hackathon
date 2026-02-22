---
name: gemini-api
description: Use this skill when the user wants to add Google Gemini AI capabilities. Provides integration guidance for chat, vision, function calling, and multimodal interactions.
---

# Gemini API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Build AI-powered applications using Google's Gemini API for chat, vision, and multimodal tasks.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://generativelanguage.googleapis.com/v1beta`

**Main Endpoints:**
- `/models/{model}:generateContent` - Generate text/multimodal responses
- `/models/{model}:streamGenerateContent` - Stream responses
- `/models/{model}:countTokens` - Count tokens before sending

## Environment Variable

- **Variable name:** `GEMINI_API_KEY`
- **Used via:** `config.geminiApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **API key in URL** - Pass key as query param `?key=YOUR_API_KEY`, not in headers (unlike OpenAI)
2. **Different message structure** - Uses `contents` array with `role` and `parts`, not OpenAI's `messages` format
3. **Vision requires base64 or URL** - Images sent as `inlineData` with `mimeType` and `data` (base64), or `fileData` with URI
4. **System instructions separate** - Use `systemInstruction` field, not first message with `role: "system"`
5. **Safety filters can block** - Response may be empty if content triggers safety filters; check `finishReason`
6. **Function calling syntax different** - Tools defined with `functionDeclarations`, responses in `functionCall` objects
7. **Token counting endpoint** - Use `countTokens` before sending large prompts to avoid errors
8. **CRITICAL for image generation** - Prepend "generate an image of:" to user prompts automatically (e.g., user says "cheese fish" → send "generate an image of cheese fish"). Gemini doesn't infer image generation intent from short phrases alone.

## Response Structure

```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        functionCall?: {
          name: string;
          args: Record<string, any>;
        };
      }>;
      role: string;
    };
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
```

## Example API Call

```bash
# Basic text generation
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Explain quantum computing in simple terms"
      }]
    }]
  }'

# With system instruction
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "systemInstruction": {
      "parts": [{
        "text": "You are a helpful physics tutor"
      }]
    },
    "contents": [{
      "parts": [{
        "text": "What is gravity?"
      }]
    }]
  }'

# Vision (image analysis)
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [
        {
          "text": "Describe this image"
        },
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "BASE64_ENCODED_IMAGE"
          }
        }
      ]
    }]
  }'
```

---

**For complete implementation patterns (edge functions, CORS, frontend integration, streaming, function calling):**
→ See the `integration-patterns` skill

