---
name: sound-effects-api
description: Use this skill when the user wants to generate sound effects using ElevenLabs. Provides integration guidance for AI-powered audio effect creation from text descriptions.
---

# ElevenLabs Sound Effects API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Generate realistic sound effects from text descriptions using ElevenLabs' AI audio synthesis.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.elevenlabs.io/v1`

**Main Endpoint:**
- `/sound-generation` - Generate sound effects from text prompts

## Environment Variable

- **Variable name:** `ELEVENLABS_API_KEY`
- **Used via:** `config.elevenLabsApiKey`
- **Pricing:** Character-based, same as TTS (10,000 chars free/month)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Duration limits** - Max 10-15 seconds per generation; chain multiple for longer effects
2. **Prompt specificity matters** - "Dog barking twice" vs "dog sound" produces very different results
3. **No pitch/speed control** - Cannot adjust playback speed or pitch post-generation
4. **Generation time varies** - 5-20 seconds depending on complexity; implement loading states
5. **Format fixed** - Returns MP3 only; no format selection
6. **Caching recommended** - Same prompt generates similar (not identical) results; cache popular effects
7. **Quality varies by complexity** - Simple effects (bell, water) work better than complex scenes

## Response Structure

```typescript
// Returns audio binary
Response: ArrayBuffer (audio/mpeg content type)
```

## Example API Call

```bash
# Generate sound effect
curl -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "A door creaking open slowly",
    "duration_seconds": 3
  }' \
  --output door_creak.mp3

# Multiple sounds
curl -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Thunder rumbling followed by rain",
    "duration_seconds": 8
  }' \
  --output storm.mp3
```

## Prompt Best Practices

**Good prompts:**
- "Glass bottle breaking on concrete"
- "Footsteps on gravel, slow walking pace"
- "Car engine starting and revving twice"
- "Ocean waves crashing on beach"

**Poor prompts:**
- "Breaking sound" (too vague)
- "Something loud" (unclear)
- "Complex action scene" (too ambitious)

**Tips:**
- Specify material: "metal", "glass", "wood"
- Include action: "breaking", "dropping", "sliding"
- Add context: "indoor", "outdoor", "echoing"
- Describe rhythm: "twice", "slow", "rapid succession"

## Use Cases

- **Game development** - Dynamic sound effects for actions
- **Podcast production** - Custom intro/outro sounds
- **App interactions** - Unique UI feedback sounds
- **Storytelling apps** - Ambient and action sounds
- **Accessibility** - Audio cues for visual elements

## Alternative Recommendations

For production sound effects:
- **Stock libraries** - More consistent, lower latency (Freesound, AudioJungle)
- **Manual recording** - Best quality, full control
- **Adobe Audition** - Professional audio editing

Use ElevenLabs Sound FX when:
- Need unique, custom sounds
- Rapid prototyping
- Dynamic sound generation based on user actions
- Budget-friendly alternative to licensing

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching, audio playback):**
→ See the `integration-patterns` skill

