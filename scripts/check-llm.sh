#!/usr/bin/env bash
# Smoke test for the free-model router: sends one prompt and shows the HTTP status,
# which provider answered (X-Routed-Via header) and the reply.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env found. Run: cp .env.example .env  and fill in LLM_API_KEY"; exit 1
fi
set -a; source .env; set +a

if [ -z "${LLM_API_KEY:-}" ]; then
  echo "LLM_API_KEY is empty in .env"; exit 1
fi

echo "Router: ${LLM_BASE_URL}  Model: ${LLM_MODEL:-auto}"
curl -sS -i "${LLM_BASE_URL}/chat/completions" \
  -H "Authorization: Bearer ${LLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${LLM_MODEL:-auto}\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with exactly: router ok\"}],\"max_tokens\":50}" \
  | grep -iE "^HTTP/|^x-routed-via|content\"" || true
