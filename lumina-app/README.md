# Lumina

Lumina is an Expo/React Native app for middle-school math tutoring, backed by Supabase (RPC-first).

The product direction is an AI math tutor that helps students solve problems step-by-step, with onboarding personalization, persistent progress, and a planned local-first hybrid LLM backend.

## What This Project Is

- **App type:** Mobile-first tutoring app (Expo, React Native, Expo Router)
- **Audience:** Middle-school learners (roughly ages 11-15)
- **Core promise:** Instant help for math problems, with a supportive tutor experience
- **Backend approach:** Supabase + edge functions + shared RPC layer
- **Planned LLM strategy:** Cactus local inference first, Gemini fallback for harder cases

## High-Level Architecture

### Frontend

- Routing shell in `app/` (auto-generated)
- Actual page implementation in `app-pages/`
  - `*Container.tsx`: layout/composition
  - `*Func.ts`: business logic
  - `*Styles.ts`: styling
- App-level components in `comp-app/`
- Shared reusable library in `comp-lib/`

### Backend

- Edge functions in `supabase/functions/`
- Shared frontend/backend DB API in `supabase/functions/_shared-client/`
- Lumina RPC client wrapper: `supabase/functions/_shared-client/lumina-db.ts`

### Database

- Lumina app schema: `supabase/schemas/1_app/100_lumina/`
- Lumina tables: `supabase/schemas/1_app/100_lumina/3_lumina-tables.sql`
- Lumina RPCs: `supabase/schemas/1_app/100_lumina/7_lumina-api-funcs.sql`
- Extends base library entities/tables (profile, conversation, messages, assets)

## Key Product/Code Entry Points

- Product prompt/context: `supabase/functions/conversation-llm/app/appPrompt.ts`
- Root app shell/navigation: `app/_layout.tsx`
- Main page code: `app-pages/`
- Shared Lumina DB API: `supabase/functions/_shared-client/lumina-db.ts`
- Lumina table schema: `supabase/schemas/1_app/100_lumina/3_lumina-tables.sql`
- Lumina RPC functions: `supabase/schemas/1_app/100_lumina/7_lumina-api-funcs.sql`

## Current Feature Status

### Implemented

- Auth flow via reusable core auth components
  - login, signup, reset password, update password
- Onboarding flow (2 steps)
  - step 1: name + grade
  - step 2: topic preferences + concerns
- Main tabs
  - Home, Progress, Profile
- Assistant chat screen (`/assistant`)
  - message history rendering
  - quick-action chips
- Chat history screen (`/chat`)
  - conversation list
  - search
  - delete
- Data persistence for onboarding/profile/preferences/home reads
- AI roundtrip plumbing through conversation edge function
- i18n merge model (`en`, `es`, `fr`) from lib + app locale files

### Stubbed / Incomplete

- Progress page is placeholder (`app-pages/(tabs)/ProgressContainer.tsx`)
- Progress hook is stub (`app-pages/(tabs)/ProgressFunc.ts`)
- Home "Snap a Problem" does not open camera/upload flow yet (`app-pages/(tabs)/HomeFunc.ts`)
- Assistant ignores passed `conversationId` / `problemId` params for resume/review flow
- `imageUri` currently triggers only text context, not full vision upload/analysis
- Custom conversation LLM hooks are stubs:
  - `supabase/functions/conversation-llm/app/useCustomLlmModelProvider.ts`
  - `supabase/functions/conversation-llm/app/useCustomLlmRequestCreator.ts`
  - `supabase/functions/conversation-llm/app/useCustomLlmSystemPrompt.ts`
  - `supabase/functions/conversation-llm/app/useCustomLlmTools.ts`
- Custom delete-user handlers are stubs:
  - `supabase/functions/user/app/custom-delete-user-handler.ts`
  - `supabase/functions/user/app/custom-delete-user-success-handler.ts`
  - `supabase/functions/user/app/custom-delete-user-failure-handler.ts`

## Lumina Data Model (App-Specific)

Defined in `3_lumina-tables.sql`:

- `private.lumina_profile`
- `private.user_preferences`
- `private.user_progress`
- `private.topic_mastery`
- `private.achievement`
- `private.lumina_conversation`
- `private.problem_attempt`
- `private.streak_history`

RPC surface (from `7_lumina-api-funcs.sql`) includes:

- profile read/upsert/complete-onboarding
- preferences read/upsert
- progress read/init/record-solved
- topic mastery read/record-attempt
- achievement read/award/mark-viewed
- conversation read/upsert/read-all/read-with-preview/delete
- problem-attempt create/read-recent
- streak-history read
- aggregated home/progress reads
- onboarding complete/is-completed

## Planned Hackathon Backend: Cactus + Gemini Hybrid

The target runtime behavior is:

1. Attempt local tool-calling inference first (Cactus / FunctionGemma path).
2. Evaluate confidence + tool-call quality.
3. Fallback to Gemini for low-confidence or hard cases.

Why this matters:

- better latency and cost on easy/medium requests
- higher quality on difficult requests via cloud fallback
- aligns with hybrid benchmark goals (accuracy, latency, on-device ratio)

Best integration points in this repo:

- `supabase/functions/conversation-llm/app/useCustomLlmModelProvider.ts`
- `supabase/functions/conversation-llm/app/useCustomLlmRequestCreator.ts`
- `supabase/functions/conversation-llm/app/useCustomLlmTools.ts`
- `supabase/functions/conversation-llm/app/useCustomLlmSystemPrompt.ts`
- `supabase/functions/conversation-llm/app/hybridRoutingPolicy.ts` (frozen routing flags + deterministic temps)
- `supabase/functions/conversation-llm/app/HybridCactusGeminiProvider.ts` (local-first routing + validation + fallback)
- `supabase/functions/conversation-llm/app/cactus-gateway/main.py` (Python runtime bridge for Cactus)

Reference repo: [functiongemma-hackathon](https://github.com/cactus-compute/functiongemma-hackathon)

## Local Development

### Prerequisites

- Node.js + npm
- Expo tooling
- Supabase CLI

### Install

```bash
npm install
```

### Required frontend env vars

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Optional backend env vars (hybrid routing)

- `CACTUS_GATEWAY_URL` (default `http://127.0.0.1:8788`)
- `LUMINA_ENABLE_LOCAL_CACTUS` (`true` or `false`)
- `LUMINA_ENABLE_REPAIR_PASS` (`true` or `false`)
- `LUMINA_ENABLE_MULTI_INTENT_REPAIR` (`true` or `false`)
- `LUMINA_ENABLE_CLOUD_MULTI_INTENT_REPAIR` (`true` or `false`)
- `LUMINA_LOCAL_CONFIDENCE_THRESHOLD` (default `0.99`)
- `LUMINA_LOCAL_TEMPERATURE` (default `0`)
- `LUMINA_CLOUD_TEMPERATURE` (default `0`)

Optional:

- `EXPO_PUBLIC_SUPABASE_AUTH_FLOW_TYPE` (`pkce` or `implicit`)
- `EXPO_PUBLIC_SUPABASE_AUTH_DETECT_SESSION_IN_URL` (`true` or `false`)
- `EXPO_PUBLIC_INSPECTOR_ENABLED`

### Run locally

```bash
# terminal 1
npm run supabase

# terminal 2
npm run edge-functions

# terminal 3
npm run expo
```

### Useful scripts

```bash
npm run compile
npm run lint
npm run test
npm run db:local-reset
npm run db:gen-types
```

## Repository Snapshot (Current)

- ~389 TypeScript/TSX files
- 36 SQL files under `supabase/`
- ~43 MB workspace size

## Suggested Build Order

1. Implement hybrid Cactus+Gemini router in custom conversation hooks.
2. Ship camera/image upload + actual vision processing path.
3. Resume assistant sessions by `conversationId` and support `problemId` review flow.
4. Replace Progress placeholder with real mastery/streak/achievement UX.
5. Add evaluation harness and safety checks for tutoring quality.
