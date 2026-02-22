---
name: integration-patterns
description: Comprehensive guide to integration patterns for React Native/Expo applications. Use this skill when implementing any external API integration to understand the 3-layer architecture, edge function setup, environment variables, frontend integration, error handling, and common patterns. This skill provides the foundation that all individual API skills reference.
---

# Integration Patterns Guide

Essential patterns for implementing external API integrations. All individual API skills reference these patterns.

## Table of Contents

1. [Documentation Access](#documentation-access)
2. [Architecture Overview](#architecture-overview)
3. [Edge Function Setup](#edge-function-setup)
4. [Environment Variables](#environment-variables)
5. [Frontend Integration](#frontend-integration)
6. [Error Handling](#error-handling)
7. [Common Patterns](#common-patterns)

---

## Documentation Access

Use Context7 API to retrieve current documentation:

```bash
# Step 1: Find library ID
curl -s "https://context7.com/api/v2/libs/search?libraryName=openai&query=dall-e" | jq '.results[0].id'

# Step 2: Fetch docs
curl -s "https://context7.com/api/v2/context?libraryId=/websites/platform_openai&query=dall-e+3&type=txt"
```

---

## Architecture Overview

**3-layer architecture** for security:

```
Frontend (React Native) → Edge Function (Deno) → External API
```

**Why?** Keeps API keys secure, enables rate limiting/caching, centralizes error handling.

**Rules:**
- Frontend calls edge functions via `supabaseClient.functions.invoke()`
- Edge functions fetch API keys from `config.*`
- Never call external APIs directly from frontend

---

## Edge Function Setup

Use `serveFunction()` - handles CORS, auth, and error formatting automatically.

```typescript
import { serveFunction, okResponse, errorResponse } from '../_shared/server/func-server.ts';
import { config } from '../_shared/config.ts';

serveFunction(false, async (req, claims) => {
  try {
    const body = await req.json();
    const apiKey = config.myApiKey;

    const response = await fetch('https://api.example.com/endpoint', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return errorResponse(`API error: ${response.status}`, response.status);
    }

    return okResponse(await response.json());
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
});
```

**Parameters:**
- `requireAuth: boolean` - Set true for user-specific operations
- `claims.userId` - Authenticated user ID
- `claims.isAdmin` - Check for admin operations

---

## Environment Variables

Use `config.*` instead of `Deno.env.get()`:

```typescript
import { config } from '../_shared/config.ts';

const apiKey = config.openaiApiKey; // NOT Deno.env.get('OPENAI_API_KEY')
```

**Setup:**
1. Define in `env-var-names.ts`: `export const ENV_VAR_OPENAI_API_KEY = 'OPENAI_API_KEY';`
2. Add to `config.ts`: `openaiApiKey: Deno.env.get(ENV_VAR_OPENAI_API_KEY) ?? ''`
3. Use in functions: `config.openaiApiKey`

**Rules:**
- Never hardcode API keys
- Assume env vars are pre-configured (don't check if they exist)
- Handle API failures, not missing vars

---

## Frontend Integration

Call edge functions via `supabaseClient.functions.invoke()`:

```typescript
import { supabaseClient } from '@/api/supabase-client';

// Simple call
const { data, error } = await supabaseClient.functions.invoke('my-api', {
  body: { param: 'value' }
});

// Hook with loading state
function useMyApi() {
  const [loading, setLoading] = useState(false);

  async function call(params: any) {
    setLoading(true);
    try {
      return await supabaseClient.functions.invoke('my-api', { body: params });
    } finally {
      setLoading(false);
    }
  }

  return { call, loading };
}
```

---

## Error Handling

Return consistent errors using `errorResponse()`:

```typescript
// In edge function
if (!apiResponse.ok) {
  return errorResponse(`API error: ${apiResponse.status}`, apiResponse.status);
}

// In frontend
const { data, error } = await supabaseClient.functions.invoke('my-api', { body: params });
if (error) {
  alert(error.message); // Show user-friendly message
}
```

**Common status codes:** 400 (validation), 401 (auth), 429 (rate limit), 500 (server error)

---


## Common Patterns

**Caching:** Store API responses in `Map` with timestamps to reduce costs.

```typescript
const cache = new Map();
const cached = cache.get(key);
if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) return cached.data;
```

**Rate Limiting:** Track user request counts per time window.

```typescript
if (!checkRateLimit(claims.userId, 10, 60000)) {
  return errorResponse('Rate limit exceeded', 429);
}
```

**Batching:** Process multiple items with `Promise.all()` for efficiency.

**Streaming:** Return `ReadableStream` for large responses (e.g., AI chat).

**Retry Logic:** Retry failed API calls with exponential backoff (1s, 2s, 4s).

---

**For specific API integrations**, check individual API skills for endpoint URLs, environment variable names, response structures, and API-specific gotchas.

