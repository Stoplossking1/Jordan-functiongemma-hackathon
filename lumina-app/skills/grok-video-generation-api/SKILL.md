---
name: grok-video-generation-api
description: Use this skill when the user wants to add xAI Grok video generation. Provides integration guidance for AI-powered video creation from text prompts.
---

# Grok Video Generation API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Generate videos from text prompts using xAI's Grok video generation capabilities.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.x.ai/v1`

**Main Endpoint:**
- `/videos/generations` - Generate videos from text prompts

## Environment Variable

- **Variable name:** `GROK_API_KEY`
- **Used via:** `config.grokApiKey`
- **Pricing:** Contact xAI for pricing (beta access)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Highly experimental** - Video generation is cutting-edge; expect bugs, changes, limited availability
2. **Very long generation times** - 5-20 minutes typical; implement async job queue with webhooks
3. **URL expiration** - Video URLs expire after 24-48 hours; download and store immediately
4. **Resolution/duration limits** - Check docs for max resolution and duration (likely 5-10 seconds initially)
5. **High compute cost** - Video generation is expensive; implement usage limits and monitoring
6. **Content moderation strict** - Prohibited content returns errors; no violent, adult, or copyrighted content
7. **No real-time preview** - Must wait for full generation; no progress updates

## Response Structure

```typescript
interface VideoGenerationResponse {
  id: string;  // Job ID for polling
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created: number;
  data?: {
    url: string;       // Temporary video URL
    duration: number;  // Duration in seconds
    resolution: string;
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
curl -X POST "https://api.x.ai/v1/videos/generations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-video-1",
    "prompt": "A time-lapse of a flower blooming, close-up shot with soft lighting",
    "duration": 5
  }'

# Poll for completion (returns job ID from first request)
curl "https://api.x.ai/v1/videos/generations/video_abc123" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Prompt Best Practices

- **Keep it simple:** Short, focused descriptions work best for short videos
- **Specify camera movement:** "camera pans left", "zoom in", "static shot"
- **Describe action:** "person walking", "leaves falling", "water flowing"
- **Set the scene:** Lighting, time of day, environment
- **Be realistic:** Current models struggle with complex physics and interactions

## Recommended Workflow

1. Submit generation request
2. Store job ID in database with user reference
3. Poll status every 30-60 seconds (exponential backoff)
4. When complete, download video to Supabase Storage
5. Update database with permanent storage URL
6. Notify user via push notification or in-app alert

## Alternative Recommendations

For production video generation:
- **Runway ML** - Gen-2 model, better documented
- **Pika Labs** - Simpler, more reliable
- **Stable Video Diffusion** - Open source option

Use Grok Video when:
- Testing cutting-edge features
- Already deeply integrated with Grok
- Willing to handle experimental API changes

---

**For complete implementation patterns (edge functions, async jobs, webhooks, video storage):**
→ See the `integration-patterns` skill

