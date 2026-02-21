---
name: vertex-ai
description: Use this skill when the user wants to add Google Cloud Vertex AI capabilities. Provides integration guidance for enterprise AI/ML models including Imagen image generation.
---

# Vertex AI Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Google Cloud Vertex AI for enterprise AI/ML including Imagen image generation.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://us-central1-aiplatform.googleapis.com/v1`

**Main Endpoints:**
- `/projects/{project}/locations/us-central1/publishers/google/models/imagegeneration@006:predict` - Imagen 3
- `/projects/{project}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent` - Gemini

## Environment Variables

- **Variable name:** `GOOGLE_VERTEX_API_KEY`
- **Used via:** `config.googleVertexApiKey`
- **Variable name:** `GOOGLE_CLOUD_PROJECT_ID`
- **Used via:** `config.googleCloudProjectId`
- **Note:** Woz provides these API keys by default. The keys are pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Project ID in URL** - Must include `config.googleCloudProjectId` in endpoint URLs
2. **Region in URL** - Use `us-central1` region in all endpoint URLs
3. **Bearer token auth** - Use `Authorization: Bearer ${config.googleVertexApiKey}` header
4. **Imagen model name** - Use `imagegeneration@006` for Imagen 3 (latest stable)
5. **Prompt in instances array** - Imagen expects `{"instances": [{"prompt": "text"}]}` format
6. **Response in predictions array** - Image data returned in `predictions[0].bytesBase64Encoded`

## Response Structure

```typescript
// Imagen response
interface ImagenResponse {
  predictions: Array<{
    bytesBase64Encoded: string;  // Base64 PNG image
    mimeType: string;
  }>;
}

// Gemini response
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}
```

## Example API Call

```bash
# Imagen 3 - Generate image
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagegeneration@006:predict" \
  -H "Authorization: Bearer ${VERTEX_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{
      "prompt": "A serene mountain landscape at sunset"
    }],
    "parameters": {
      "sampleCount": 1
    }
  }'

# Gemini via Vertex AI
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent" \
  -H "Authorization: Bearer ${VERTEX_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Explain quantum computing"}]
    }]
  }'
```

---

**For complete implementation patterns (edge functions, authentication, streaming, custom models):**
→ See the `integration-patterns` skill

