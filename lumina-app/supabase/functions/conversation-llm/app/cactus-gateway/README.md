# Cactus Gateway (Local Dev)

This gateway runs FunctionGemma through Cactus over HTTP so the Supabase edge function can use local-first routing.

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

2. Set environment variables (optional defaults shown):

- `LUMINA_CACTUS_PYTHON_SRC` (default: `cactus/python/src`)
- `LUMINA_CACTUS_WEIGHTS_PATH` (default: `cactus/weights/functiongemma-270m-it`)

3. Start the service:

```bash
uvicorn main:app --host 127.0.0.1 --port 8788 --reload
```

4. Configure Lumina edge runtime:

- `CACTUS_GATEWAY_URL=http://127.0.0.1:8788`

## Endpoints

- `GET /health`
- `POST /infer`
