---
name: voice-conversion-api
description: Use this skill when the user wants to convert voices using ElevenLabs. Provides integration guidance for transforming voice recordings into different voices while preserving emotion and timing.
---

# ElevenLabs Voice Conversion API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Transform voice recordings into different voices while preserving speech patterns and emotion using ElevenLabs.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.elevenlabs.io/v1`

**Main Endpoint:**
- `/speech-to-speech/{voice_id}` - Convert audio to different voice

## Environment Variable

- **Variable name:** `ELEVENLABS_API_KEY`
- **Used via:** `config.elevenLabsApiKey`
- **Pricing:** Character-based like TTS; ~1000 characters per minute of audio
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Preserves timing and emotion** - Unlike TTS, keeps original pacing, pauses, and emotional inflections
2. **File size limit** - 10MB max; approximately 10 minutes of audio at standard quality
3. **Supported formats** - MP3, WAV, M4A, FLAC, OGG, WEBM
4. **Processing time** - Roughly real-time (1 minute input = 1 minute processing)
5. **Background noise affects quality** - Clean input audio produces better results; pre-process with audio-isolation
6. **Voice ID required** - Must specify target voice; cannot auto-select
7. **Original language preserved** - Converts voice, not language; use translation separately

## Response Structure

```typescript
// Returns converted audio binary
Response: ArrayBuffer (audio/mpeg content type)
```

## Example API Call

```bash
# Convert voice recording
curl -X POST "https://api.elevenlabs.io/v1/speech-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "audio=@original_recording.mp3" \
  -F "model_id=eleven_english_sts_v2"

# With voice settings
curl -X POST "https://api.elevenlabs.io/v1/speech-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "audio=@original_recording.mp3" \
  -F "model_id=eleven_english_sts_v2" \
  -F "voice_settings={"stability":0.5,"similarity_boost":0.75}"
```

## Models

- **eleven_english_sts_v2** - Latest English speech-to-speech (recommended)
- **eleven_multilingual_sts_v2** - Multilingual support (29+ languages)

## Use Cases

- **Voice anonymization** - Protect speaker identity while keeping natural delivery
- **Dubbing** - Convert voice actor recordings to different characters
- **Accessibility** - Provide voice options for content creators
- **Localization** - Change narrator voice for different markets
- **Voice restoration** - Apply clean voice to degraded recordings

## Workflow Example

1. User records audio (voice memo, video narration)
2. Optional: Clean with audio-isolation API
3. Convert to target voice via speech-to-speech
4. Store result in Supabase Storage
5. Return to user for review/download

## Quality Tips

1. **Clean input audio first** - Use audio-isolation to remove background noise
2. **Match voice characteristics** - Choose target voice with similar gender/age for best results
3. **Short clips work better** - Break long recordings into segments for processing
4. **Standard sample rates** - 44.1kHz or 48kHz recommended
5. **Mono preferred** - Convert stereo to mono for consistent results

## Alternative Recommendations

- **Respeecher** - Professional voice cloning for film/TV
- **Descript Overdub** - Voice editing and synthesis
- **Resemble AI** - Real-time voice conversion

Use ElevenLabs Voice Conversion when:
- Already using ElevenLabs ecosystem
- Need quick voice swaps
- Preserving timing/emotion is critical
- Budget-conscious projects

---

**For complete implementation patterns (edge functions, CORS, frontend integration, audio preprocessing):**
→ See the `integration-patterns` skill

