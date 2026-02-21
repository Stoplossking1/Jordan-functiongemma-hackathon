---
name: openai-stt-api
description: Use this skill when the user wants to add speech-to-text transcription using OpenAI Whisper. Provides integration guidance for audio transcription with support for 50+ languages.
---

# OpenAI Speech-to-Text API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Transcribe audio to text using OpenAI's Whisper API with support for 50+ languages and automatic language detection.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.openai.com/v1`

**Main Endpoints:**
- `/audio/transcriptions` - Transcribe audio to text
- `/audio/translations` - Translate audio to English

## Environment Variable

- **Variable name:** `OPENAI_API_KEY`
- **Used via:** `config.openaiApiKey`
- **Pricing:** $0.006 per minute of audio
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **File size limit** - 25MB max file size; chunk larger files into segments
2. **Supported formats** - mp3, mp4, mpeg, mpga, m4a, wav, webm (flac, ogg not officially listed but may work)
3. **Language parameter optional** - Auto-detection works well, but specifying language improves accuracy and speed
4. **Timestamp granularity** - Use `timestamp_granularities: ["word", "segment"]` for precise timing data
5. **Response format options** - json, text, srt, verbose_json, vtt (use verbose_json for timestamps)
6. **Temperature control** - 0-1 range; lower = more consistent, higher = more creative (default 0)
7. **Prompt for context** - Optional `prompt` parameter helps with spelling, context, and style consistency

## Response Structure

```typescript
// Standard JSON response
interface TranscriptionResponse {
  text: string;  // Transcribed text
}

// Verbose JSON response (with timestamp_granularities)
interface VerboseTranscriptionResponse {
  task: string;  // "transcribe" or "translate"
  language: string;  // Detected/specified language code
  duration: number;  // Audio duration in seconds
  text: string;  // Full transcription
  words?: Array<{
    word: string;
    start: number;  // Start time in seconds
    end: number;    // End time in seconds
  }>;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}
```

## Example API Call

```bash
# Basic transcription
curl -X POST "https://api.openai.com/v1/audio/transcriptions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1"

# With language and timestamps
curl -X POST "https://api.openai.com/v1/audio/transcriptions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1" \
  -F "language=en" \
  -F "response_format=verbose_json" \
  -F "timestamp_granularities[]=word"

# Translate to English
curl -X POST "https://api.openai.com/v1/audio/translations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1"
```

## Language Codes (Common)

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching, error handling):**
→ See the `integration-patterns` skill

