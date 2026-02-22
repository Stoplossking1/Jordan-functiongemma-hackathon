#!/bin/bash
# Script to run Supabase Edge Functions locally with the Cactus gateway

# Check if service role key is provided
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
  echo ""
  echo "To get your service role key:"
  echo "1. Go to https://supabase.com/dashboard/project/apgcengnlftuzuoypyie/settings/api"
  echo "2. Copy the 'service_role' key under 'Project API keys'"
  echo "3. Run: export SUPABASE_SERVICE_ROLE_KEY='your-key-here'"
  echo "4. Then run this script again"
  exit 1
fi

# Set environment variables for local development
export LOCALDEV_URL="https://apgcengnlftuzuoypyie.supabase.co"
export LOCALDEV_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZ2NlbmdubGZ0dXp1b3lweWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDU5NTMsImV4cCI6MjA4NzEyMTk1M30.3rVEmflU3XxrXmI_rnTKeRHwzLxxPh0SUOIXmCKw7OY"
export LOCALDEV_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Gemini API key
export GEMINI_API_KEY="${GEMINI_API_KEY:-AIzaSyDrhiP8CnHyuNdysyYOAjkwz1AFM0_tyHc}"

# Cactus Gateway (local FunctionGemma)
export CACTUS_GATEWAY_URL="http://127.0.0.1:8788"
export LUMINA_ENABLE_LOCAL_CACTUS="true"
export LUMINA_ENABLE_REPAIR_PASS="true"
export LUMINA_ENABLE_MULTI_INTENT_REPAIR="false"
export LUMINA_ENABLE_CLOUD_MULTI_INTENT_REPAIR="true"

echo "Starting Supabase Edge Functions locally..."
echo "  - Supabase URL: $LOCALDEV_URL"
echo "  - Cactus Gateway: $CACTUS_GATEWAY_URL"
echo ""
echo "Make sure the Cactus gateway is running:"
echo "  cd supabase/functions/conversation-llm/app/cactus-gateway"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --host 127.0.0.1 --port 8788"
echo ""

# Run the functions locally
cd "$(dirname "$0")"
supabase functions serve --no-verify-jwt --env-file /dev/null

