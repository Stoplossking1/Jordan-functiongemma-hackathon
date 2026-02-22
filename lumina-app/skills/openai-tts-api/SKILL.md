---
name: openai-tts-api
description: Use this skill when the user wants to add text-to-speech capabilities using OpenAI TTS. Provides integration guidance as a cost-effective alternative to ElevenLabs. Pay-per-use pricing: $15-30 per 1M characters.
---

# OpenAI Text-to-Speech API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Convert text to natural-sounding speech using OpenAI's TTS API as a cost-effective alternative to ElevenLabs.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.openai.com/v1`

**Main Endpoint:**
- `/audio/speech` - Convert text to speech

**Voices:** alloy, echo, fable, onyx, nova, shimmer

## Environment Variable

- **Variable name:** `OPENAI_API_KEY`
- **Used via:** `config.openaiApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Character limit per request** - 4096 characters max; chunk longer text
2. **Speed control** - Adjust speed from 0.25x to 4.0x (`speed` parameter)
3. **Voice selection matters** - Choose voice that matches content tone (alloy=neutral, nova=energetic, onyx=authoritative)
4. **Format options** - Supports mp3, opus, aac, flac, wav, pcm (mp3 recommended for web/mobile)
5. **No streaming** - Must wait for complete audio generation (use opus for lowest latency)
6. **Cache aggressively** - Same text generates same audio; cache to save costs
7. **Chunking strategy** - Split on sentence boundaries, not arbitrary character counts

## Response Structure

**Response:** Audio file as binary data (ArrayBuffer/Blob)

**Content-Type header indicates format:**
- `audio/mpeg` - MP3 format
- `audio/opus` - Opus format
- `audio/aac` - AAC format
- `audio/wav` - WAV format

## Example API Call

```bash
curl -X POST "https://api.openai.com/v1/audio/speech" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello! This is a test of OpenAI text to speech.",
    "voice": "alloy",
    "response_format": "mp3",
    "speed": 1.0
  }' \
  --output speech.mp3
```

## Voice Characteristics

- **alloy** - Neutral, balanced (general purpose)
- **echo** - Deep, resonant (audiobooks, drama)
- **fable** - Warm, expressive (storytelling)
- **onyx** - Strong, authoritative (news, professional)
- **nova** - Energetic, friendly (casual, social)
- **shimmer** - Soft, pleasant (calm, meditation)

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching, error handling):**
→ See the `integration-patterns` skill

