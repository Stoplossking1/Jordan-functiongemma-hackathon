---
name: openai-image-generation-api
description: Use this skill when the user wants to add AI image generation using OpenAI DALL-E. Provides integration guidance for creating, editing, and varying images from text descriptions.
---

# OpenAI Image Generation API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Generate, edit, and create variations of images using OpenAI's DALL-E API.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.openai.com/v1`

**Main Endpoints:**
- `/images/generations` - Generate images from text prompts
- `/images/edits` - Edit images with masks and prompts
- `/images/variations` - Create variations of existing images

## Environment Variable

- **Variable name:** `OPENAI_API_KEY`
- **Used via:** `config.openaiApiKey`
- **Pricing:** DALL-E 3: $0.040-0.120/image, DALL-E 2: $0.016-0.020/image
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **DALL-E 3 is one-at-a-time** - Cannot generate multiple images per request (n=1 only); use DALL-E 2 for batches
2. **Size options limited** - DALL-E 3: 1024x1024, 1792x1024, 1024x1792; DALL-E 2: 256x256, 512x512, 1024x1024
3. **Quality vs cost tradeoff** - DALL-E 3 `quality: "hd"` costs 2x more than `standard`
4. **Style parameter** - DALL-E 3 only: `vivid` (hyper-real) or `natural` (less opinionated)
5. **Content policy strict** - Avoid prompts with faces, violence, copyrighted content; API returns error, not filtered result
6. **URL expiration** - Image URLs expire after 1 hour; download and store immediately
7. **Edit requires PNG with alpha** - Image editing needs transparent mask layer (PNG format only)

## Response Structure

```typescript
interface ImageGenerationResponse {
  created: number;  // Unix timestamp
  data: Array<{
    url?: string;         // Temporary URL (expires in 1 hour)
    b64_json?: string;    // Base64-encoded image (if requested)
    revised_prompt?: string;  // DALL-E 3 may revise your prompt
  }>;
}
```

## Example API Call

```bash
# DALL-E 3 generation (highest quality)
curl -X POST "https://api.openai.com/v1/images/generations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A serene mountain landscape at sunset with a lake reflection",
    "size": "1024x1024",
    "quality": "standard",
    "style": "natural",
    "n": 1
  }'

# DALL-E 2 batch generation
curl -X POST "https://api.openai.com/v1/images/generations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-2",
    "prompt": "A cartoon robot mascot",
    "size": "512x512",
    "n": 4
  }'

# Image editing (DALL-E 2 only)
curl -X POST "https://api.openai.com/v1/images/edits" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@original.png" \
  -F "mask=@mask.png" \
  -F "prompt=Add a red hat" \
  -F "n=1" \
  -F "size=512x512"

# Create variations (DALL-E 2 only)
curl -X POST "https://api.openai.com/v1/images/variations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@original.png" \
  -F "n=3" \
  -F "size=512x512"
```

## Pricing Breakdown

**DALL-E 3:**
- 1024x1024 standard: $0.040/image
- 1024x1024 HD: $0.080/image
- 1792x1024/1024x1792 standard: $0.080/image
- 1792x1024/1024x1792 HD: $0.120/image

**DALL-E 2:**
- 256x256: $0.016/image
- 512x512: $0.018/image
- 1024x1024: $0.020/image

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching, error handling):**
→ See the `integration-patterns` skill

