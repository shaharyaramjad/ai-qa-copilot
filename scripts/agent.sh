#!/usr/bin/env bash
# Starts OpenCode with the .env values (router address and key) loaded.
# Usage: npm run agent
set -e
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then echo "Missing .env. Copy .env.example to .env and add your key."; exit 1; fi
set -a; . ./.env; set +a
if ! command -v opencode >/dev/null 2>&1; then
  echo "OpenCode is not installed. Install it once with:  npm install -g opencode-ai"; exit 1
fi
exec opencode
