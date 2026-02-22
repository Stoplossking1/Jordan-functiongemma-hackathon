---
name: sora-video-generation-api
description: Use this skill when the user wants to add AI video generation using OpenAI Sora. Provides integration guidance for creating videos from text descriptions.
---

# Sora Video Generation API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Generate videos from text prompts using OpenAI's Sora API.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.openai.com/v1`

**Main Endpoint:**
- `/videos/generations` - Generate videos from text prompts

## Environment Variable

- **Variable name:** `OPENAI_API_KEY`
- **Used via:** `config.openaiApiKey`
- **Pricing:** Contact OpenAI for pricing (high compute cost)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Long generation times** - Videos can take 5-15 minutes to generate; implement async processing with webhooks/polling
2. **Resolution options** - 1080p, 720p, 480p available; higher resolution = longer generation time
3. **Duration limits** - Maximum 60 seconds per video; longer videos require stitching multiple generations
4. **Prompt engineering critical** - Be specific about camera movement, lighting, subjects, and style
5. **Content policy strict** - No faces of real people, violence, copyrighted characters; API returns error
6. **URL expiration** - Video URLs expire after 24 hours; download and store in your storage bucket
7. **No streaming** - Must wait for complete video generation before download

## Response Structure

```typescript
interface VideoGenerationResponse {
  id: string;  // Generation ID for polling
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created: number;  // Unix timestamp
  data?: {
    url: string;  // Temporary video URL (expires in 24 hours)
    duration: number;  // Video duration in seconds
    resolution: string;  // e.g., "1080p"
  };
  error?: {
    message: string;
    type: string;
  };
}
```

## Example API Call

```bash
# Start video generation
curl -X POST "https://api.openai.com/v1/videos/generations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora-1.0",
    "prompt": "A serene underwater scene with colorful fish swimming among coral reefs, sunlight filtering through the water creating dancing light patterns",
    "resolution": "1080p",
    "duration": 10
  }'

# Poll for completion
curl "https://api.openai.com/v1/videos/generations/video_abc123" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Prompt Best Practices

- **Be specific about movement:** "camera slowly pans left", "subject walks toward camera"
- **Describe lighting:** "golden hour lighting", "dramatic shadows", "soft diffused light"
- **Set the scene:** "professional studio setup", "natural outdoor environment", "minimalist white background"
- **Specify style:** "cinematic", "documentary style", "time-lapse", "slow motion"
- **Include details:** Colors, textures, atmosphere, mood

## Recommended Workflow

1. Submit generation request → receive `id`
2. Poll status every 30 seconds (exponential backoff)
3. When `status === 'completed'`, download video immediately
4. Store in Supabase Storage bucket
5. Update database with permanent storage URL

---

**For complete implementation patterns (edge functions, CORS, frontend integration, async processing):**
→ See the `integration-patterns` skill

