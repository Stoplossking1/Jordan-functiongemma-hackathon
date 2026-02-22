# Cactus Gateway (Local Dev)

This gateway runs FunctionGemma through Cactus over HTTP so the Supabase edge function can use local-first routing. It also provides audio transcription via the Gemini API.

## Why this exists

Supabase edge functions run in a Deno runtime, while Cactus runs in Python/native.
The gateway bridges those runtimes.

## Run locally

1. Install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Download required models:

```bash
# Function calling model
cactus download google/functiongemma-270m-it
```

3. Set environment variables:

**Required:**
- `GEMINI_API_KEY` - Your Google Gemini API key (for audio transcription)

**Optional (defaults shown):**
- `LUMINA_CACTUS_PYTHON_SRC` (default: `cactus/python/src`)
- `LUMINA_CACTUS_WEIGHTS_PATH` (default: `cactus/weights/functiongemma-270m-it`)

4. Start the service:

```bash
export GEMINI_API_KEY=your-api-key-here
uvicorn main:app --host 127.0.0.1 --port 8788 --reload
```

5. Configure Lumina edge runtime:

- `CACTUS_GATEWAY_URL=http://127.0.0.1:8788`

## Endpoints

- `GET /health` - Health check
- `POST /infer` - Function calling inference with FunctionGemma
- `POST /transcribe` - Audio transcription via Gemini API

### POST /transcribe

Transcribes audio using the Gemini API.

**Request body:**
```json
{
  "audioBase64": "base64-encoded-audio-data",
  "audioMimeType": "audio/mp4",
  "prompt": "Optional transcription prompt"
}
```

**Response:**
```json
{
  "text": "Transcribed text",
  "confidence": 1.0,
  "totalTimeInMs": 1234.5
}
```
