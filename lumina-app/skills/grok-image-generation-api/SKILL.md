---
name: grok-image-generation-api
description: Use this skill when the user wants to add xAI Grok image generation. Provides integration guidance for AI-powered image creation from text prompts.
---

# Grok Image Generation API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Generate images from text prompts using xAI's Grok image generation capabilities.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.x.ai/v1`

**Main Endpoint:**
- `/images/generations` - Generate images from text prompts

## Environment Variable

- **Variable name:** `GROK_API_KEY`
- **Used via:** `config.grokApiKey`
- **Pricing:** Contact xAI for pricing (beta access)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Beta/limited availability** - Image generation may not be widely available; check beta access status
2. **Generation time varies** - Can take 10-60 seconds; implement loading states
3. **URL expiration** - Generated image URLs expire after 24 hours; download and store immediately
4. **Size options limited** - Check documentation for available resolution options (may be limited vs DALL-E)
5. **Content moderation** - Strict content policy; prompts with prohibited content return errors
6. **No batch generation** - Likely limited to one image per request (confirm in docs)
7. **Prompt engineering important** - Be specific about style, composition, lighting for best results

## Response Structure

```typescript
interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url: string;        // Temporary URL (expires in 24 hours)
    revised_prompt?: string;  // May revise prompt for safety/quality
  }>;
}
```

## Example API Call

```bash
# Generate image
curl -X POST "https://api.x.ai/v1/images/generations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-image-1",
    "prompt": "A futuristic cityscape at sunset with flying vehicles",
    "size": "1024x1024",
    "n": 1
  }'
```

## Prompt Best Practices

- **Be specific:** "photorealistic portrait" vs "picture of person"
- **Include style:** "digital art", "oil painting", "3D render", "sketch"
- **Describe lighting:** "soft natural light", "dramatic shadows", "golden hour"
- **Set composition:** "close-up", "wide angle", "aerial view"
- **Add details:** Colors, mood, atmosphere, textures

## Alternative Recommendations

If Grok image generation is unavailable or limited:
- **DALL-E 3** - Best quality, reliable API
- **Midjourney** (via unofficial API) - Artistic style
- **Stable Diffusion** - Open source, self-hosted option
- **Replicate** - Access multiple image models via one API

Use Grok Image when:
- Already integrated with Grok ecosystem
- Need consistency with Grok's style/capabilities
- Testing beta features

---

**For complete implementation patterns (edge functions, CORS, frontend integration, image storage):**
→ See the `integration-patterns` skill

