---
name: voice-design-api
description: Use this skill when the user wants to create custom AI voices using ElevenLabs. Provides integration guidance for generating unique voices from text descriptions.
---

# ElevenLabs Voice Design API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Create custom AI voices from text descriptions using ElevenLabs' Voice Design feature.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.elevenlabs.io/v1`

**Main Endpoints:**
- `/voice-generation/generate-voice` - Generate voice from description
- `/voices/add` - Add generated voice to your library

## Environment Variable

- **Variable name:** `ELEVENLABS_API_KEY`
- **Used via:** `config.elevenLabsApiKey`
- **Pricing:** Voice generation usage depends on your plan tier
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Tier restrictions** - Voice design only available on paid plans; check tier limits
2. **Description quality matters** - Specific descriptions produce better results than vague ones
3. **Generation time varies** - 10-30 seconds to generate voice preview
4. **Cannot edit after creation** - Must regenerate if unsatisfied; no fine-tuning
5. **Voice library limits** - Each tier has max voice slots; delete unused voices
6. **Preview before adding** - Test generated voice before adding to library (permanent action)
7. **No voice cloning via API** - Voice design creates new voices; cloning requires web interface

## Response Structure

```typescript
interface VoiceGenerationResponse {
  voice_id: string;
  preview_url: string;  // Temporary URL to hear sample
  generated_voice_id: string;
}

interface AddVoiceResponse {
  voice_id: string;
  name: string;
}
```

## Example API Call

```bash
# Generate voice from description
curl -X POST "https://api.elevenlabs.io/v1/voice-generation/generate-voice" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "A young woman with a warm, friendly tone and slight British accent",
    "gender": "female",
    "age": "young"
  }'

# Add generated voice to library
curl -X POST "https://api.elevenlabs.io/v1/voices/add" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah - Friendly Guide",
    "generated_voice_id": "generated_voice_abc123"
  }'
```

## Description Best Practices

**Good descriptions:**
- "Deep male voice, authoritative and calm, American accent, middle-aged"
- "Energetic female voice, young and enthusiastic, clear pronunciation"
- "Soft-spoken male narrator, British accent, mature and thoughtful"

**Include:**
- **Gender:** male, female, neutral
- **Age:** young, middle-aged, old
- **Accent:** American, British, Australian, etc.
- **Tone:** warm, friendly, authoritative, energetic, calm
- **Characteristics:** deep, high-pitched, raspy, smooth

**Avoid:**
- "Good voice" (too vague)
- Real person names (doesn't clone real voices)
- Multiple conflicting traits

## Use Cases

- **Brand voices** - Create unique voice for your brand/product
- **Character voices** - Generate distinct voices for storytelling apps
- **Multilingual apps** - Create voice variants for different markets
- **Accessibility** - Provide voice options matching user preferences
- **A/B testing** - Test different voice styles with users

## Workflow Example

1. User describes desired voice characteristics
2. Generate voice via API
3. Play preview for user approval
4. If approved, add to voice library
5. Use voice ID in TTS calls
6. Store voice ID in database for future use

## Voice Management

- **List voices:** `GET /v1/voices` to see all available voices
- **Delete voice:** `DELETE /v1/voices/{voice_id}` to free up slots
- **Voice settings:** Each voice can have custom stability/similarity settings

## Alternative Approaches

- **Pre-built voices** - Use ElevenLabs' default voices (simpler, no generation needed)
- **Voice cloning** - Upload audio samples via web interface (more control)
- **Third-party voices** - ElevenLabs Voice Library marketplace

Use Voice Design when:
- Need unique, custom voices
- Specific voice characteristics required
- No audio samples available for cloning
- Rapid voice creation needed

---

**For complete implementation patterns (edge functions, CORS, frontend integration, voice library management):**
→ See the `integration-patterns` skill

