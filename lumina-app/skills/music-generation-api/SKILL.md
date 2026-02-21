---
name: music-generation-api
description: Use this skill when the user wants to generate music using ElevenLabs. Provides integration guidance for AI-powered music creation from text descriptions.
---

# ElevenLabs Music Generation API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Generate background music and musical compositions from text prompts using ElevenLabs' AI music synthesis.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.elevenlabs.io/v1`

**Main Endpoint:**
- `/music-generation` - Generate music from text descriptions

## Environment Variable

- **Variable name:** `ELEVENLABS_API_KEY`
- **Used via:** `config.elevenLabsApiKey`
- **Pricing:** Higher cost than TTS; check current pricing per minute of audio
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Long generation times** - 30-90 seconds for 30-second clips; implement async processing
2. **Duration limits** - Typically 30-60 seconds max; loop or chain for longer tracks
3. **Quality vs description** - Generic prompts yield generic music; be specific about genre, mood, instruments
4. **No precise control** - Cannot specify exact BPM, key, or chord progressions
5. **Copyright unclear** - Review terms for commercial use; AI-generated music licensing is evolving
6. **No MIDI export** - Audio only (MP3); cannot edit as MIDI
7. **Consistency limited** - Same prompt produces variations; hard to generate exact matches

## Response Structure

```typescript
// Returns audio binary
Response: ArrayBuffer (audio/mpeg content type)
```

## Example API Call

```bash
# Generate background music
curl -X POST "https://api.elevenlabs.io/v1/music-generation" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Upbeat electronic music with synth pads and a driving beat, perfect for a tech product demo",
    "duration_seconds": 30
  }' \
  --output background.mp3

# Specific mood and style
curl -X POST "https://api.elevenlabs.io/v1/music-generation" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Calm acoustic guitar instrumental, slow tempo, melancholic mood, suitable for meditation",
    "duration_seconds": 45
  }' \
  --output meditation.mp3
```

## Prompt Best Practices

**Include:**
- **Genre:** "jazz", "electronic", "classical", "folk", "ambient"
- **Mood:** "upbeat", "calm", "energetic", "melancholic", "mysterious"
- **Instruments:** "piano", "guitar", "synth", "strings", "drums"
- **Tempo:** "fast", "slow", "moderate", "driving beat"
- **Use case:** "background for podcast", "intro music", "meditation"

**Example prompts:**
- "Jazzy piano background music, upbeat and playful, with light brushes on drums"
- "Cinematic orchestral swell, dramatic and emotional, building to a climax"
- "Lo-fi hip hop beat, relaxed and chill, perfect for studying"

## Use Cases

- **App intros** - Custom intro/splash screen music
- **Background music** - Meditation, focus, or relaxation apps
- **Podcast intros** - Unique branded intro music
- **Game music** - Procedurally generated background tracks
- **Video content** - Royalty-free music for videos

## Alternative Recommendations

For production music:
- **Stock music libraries** - More professional (Epidemic Sound, AudioJungle, Artlist)
- **Human composers** - Best quality, full customization
- **AIVA.ai** - Specialized AI music composition
- **Soundraw** - AI music with more control

Use ElevenLabs Music when:
- Rapid prototyping
- Need unique, non-stock music
- Budget constraints
- Experimental/creative projects

## Legal Considerations

- Check ElevenLabs terms for commercial use rights
- AI-generated music copyright is evolving
- May need attribution depending on plan
- For commercial apps, consider consulting legal advisor

---

**For complete implementation patterns (edge functions, CORS, frontend integration, async processing, audio storage):**
→ See the `integration-patterns` skill

