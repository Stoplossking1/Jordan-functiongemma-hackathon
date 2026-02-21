---
name: grok-voice-api
description: Use this skill when the user wants to add xAI Grok voice capabilities. Provides integration guidance for voice-to-voice AI interactions.
---

# Grok Voice API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Build voice-enabled AI applications using xAI's Grok Voice API for natural spoken interactions.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.x.ai/v1`

**Main Endpoints:**
- `/audio/speech` - Text-to-speech conversion
- `/audio/transcriptions` - Speech-to-text transcription

## Environment Variable

- **Variable name:** `GROK_API_KEY`
- **Used via:** `config.grokApiKey`
- **Pricing:** Contact xAI for pricing (beta access)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Beta feature** - Voice API is in early beta; availability and features may change
2. **Limited voice options** - Currently fewer voice choices than competitors (ElevenLabs, OpenAI)
3. **Format support** - Supports mp3, opus, wav; prefer opus for lowest latency
4. **No streaming TTS** - Text-to-speech must complete before audio is available
5. **Real-time optimization** - Optimized for low-latency voice conversations
6. **File size limits** - 25MB max for transcription uploads
7. **Language support limited** - Primarily English; check docs for current language support

## Response Structure

```typescript
// Text-to-speech returns audio binary
Response: ArrayBuffer (audio/mpeg or audio/opus)

// Speech-to-text returns JSON
interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
}
```

## Example API Call

```bash
# Text-to-speech
curl -X POST "https://api.x.ai/v1/audio/speech" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-voice-1",
    "input": "Hello, this is Grok speaking!",
    "voice": "default",
    "response_format": "mp3"
  }' \
  --output speech.mp3

# Speech-to-text
curl -X POST "https://api.x.ai/v1/audio/transcriptions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model=grok-voice-1"
```

## Use Cases

- **Voice assistants** - Real-time spoken interactions
- **Voice commands** - Voice-controlled app features
- **Accessibility** - Voice alternatives for text interfaces
- **Interactive storytelling** - Narrated content

## Alternative Recommendations

For production voice features, consider:
- **OpenAI TTS/Whisper** - More mature, better documentation
- **ElevenLabs** - Superior voice quality, more options
- **Google Cloud Speech** - Enterprise-grade, multi-language

Use Grok Voice when:
- Already using Grok Chat
- Need integration with Grok's knowledge base
- Testing beta features

---

**For complete implementation patterns (edge functions, CORS, frontend integration, streaming):**
→ See the `integration-patterns` skill

