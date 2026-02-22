---
name: grok-collections-api
description: Use this skill when the user wants to organize Grok AI interactions with Collections. Provides integration guidance for managing conversation threads and context.
---

# Grok Collections API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Organize and manage AI conversations using xAI's Grok Collections feature.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.x.ai/v1`

**Main Endpoints:**
- `/collections` - Create and list collections
- `/collections/{id}` - Get, update, delete collection
- `/collections/{id}/messages` - Manage messages in collection

## Environment Variable

- **Variable name:** `GROK_API_KEY`
- **Used via:** `config.grokApiKey`
- **Pricing:** Contact xAI for pricing (beta access)
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Beta feature** - Collections API is experimental; may change or be deprecated
2. **Collection limits** - Check rate limits on collection creation (typically 100-1000 per account)
3. **Message retention** - Collections may have storage limits; older messages might be archived
4. **Context window** - Collections share Grok's context window; very large collections may truncate
5. **No automatic summarization** - Must manually manage collection summaries for long threads
6. **Permissions model unclear** - Sharing/collaboration features not fully documented
7. **Use for multi-turn** - Best for maintaining context across multiple conversations

## Response Structure

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at: number;
  updated_at: number;
  message_count: number;
  metadata?: Record<string, any>;
}

interface CollectionMessage {
  id: string;
  collection_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
  metadata?: Record<string, any>;
}
```

## Example API Call

```bash
# Create collection
curl -X POST "https://api.x.ai/v1/collections" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Research",
    "description": "AI conversations about product features"
  }'

# List collections
curl "https://api.x.ai/v1/collections" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Add message to collection
curl -X POST "https://api.x.ai/v1/collections/col_abc123/messages" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "What features should we prioritize?"
  }'

# Get collection messages
curl "https://api.x.ai/v1/collections/col_abc123/messages" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Use Cases

- **Project-based conversations** - Group related AI interactions
- **Research threads** - Maintain context across research sessions
- **Customer support** - Organize support conversations by customer
- **Multi-session context** - Continue conversations across app sessions

## Alternative Approaches

If Collections API is unavailable or insufficient:
- Store conversation history in your database
- Use Supabase `conversation` table with `messages` relationship
- Implement custom context management
- Use vector databases for semantic search across conversations

---

**For complete implementation patterns (edge functions, CORS, frontend integration, state management):**
→ See the `integration-patterns` skill

