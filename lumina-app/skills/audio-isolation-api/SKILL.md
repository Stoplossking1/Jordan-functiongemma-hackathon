---
name: audio-isolation-api
description: Use this skill when the user wants to remove background noise, isolate speech, or clean up audio recordings. Provides ElevenLabs Voice Isolator API integration guidance for podcast cleanup, video editing, and audio quality enhancement.
---

# Audio Isolation API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Remove background noise and extract clean speech using the ElevenLabs Voice Isolator API.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.elevenlabs.io/v1`

**Main Endpoint:**
- `POST /audio-isolation` - Remove background noise from audio

## Environment Variable

- **Variable name:** `ELEVENLABS_API_KEY`
- **Used via:** `config.elevenLabsApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **File size limits** - 500MB max file size, 1-hour max duration
2. **Supported formats** - MP3, WAV, MP4, MOV, M4A, FLAC, OGG (extracts audio from video)
3. **Character-based pricing** - ~1,000 characters per minute of audio processed
4. **Processing time** - Can take 30-90 seconds for longer files; implement async processing for UX
5. **Output format** - Always returns MP3 (high quality), cannot choose format
6. **No streaming** - Must upload full file, wait for processing, then download result
7. **Cache cleaned audio** - Store results to avoid reprocessing same files

## Response Structure

```typescript
// API returns audio/mpeg binary data
// No JSON response - just cleaned audio file
Response: ArrayBuffer (audio/mpeg content type)
```

## Example API Call

```bash
# Basic audio isolation
curl -X POST "https://api.elevenlabs.io/v1/audio-isolation" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "audio=@podcast.mp3" \
  --output cleaned_audio.mp3
```

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching):**
→ See the `integration-patterns` skill

