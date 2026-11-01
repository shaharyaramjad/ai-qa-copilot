# Free model setup (FreeLLMAPI router)

Goal: use free LLMs for the AI steps of this project. If one model fails or is rate-limited, the router moves to the next one automatically.

Router: https://github.com/tashfeenahmed/freellmapi (MIT, self-hosted, one OpenAI-compatible endpoint).


> **Port note:** the desktop app showed its address on the **Agents** page: `http://127.0.0.1:31415/v1` (Claude Code's card shows it without `/v1`). The `3001` port in this guide applies to Docker/source installs. Use whatever the Agents page shows.

## 1. Install the router (macOS)
1. Download the `.dmg` from https://github.com/tashfeenahmed/freellmapi/releases/latest (pick **arm64** for Apple Silicon).
2. Install and open it. The unified API key is shown in the tray popover (starts with `freellmapi-`).
3. In the app window go to **Keys** and add your free provider keys (for example Groq, Cerebras, Google AI Studio). Docker/source installs: open http://localhost:3001 instead.
4. Reorder the **Fallback Chain**: best model first. On a 429/5xx the router cools that key down and tries the next one.

Docker alternative: `curl -fsSL https://freellmapi.co/install.sh | bash` (read the script first).

## 2. Connect this project
```bash
cp .env.example .env      # then paste the unified key into LLM_API_KEY
npm run check:llm         # expect HTTP 200 and an X-Routed-Via header
```

## 3. Connect an agent tool
In the tool's custom OpenAI-compatible provider settings use:

| Setting | Value |
|---|---|
| Base URL | `http://127.0.0.1:31415/v1` for the desktop app (copy it from the Agents page); `http://localhost:3001/v1` for Docker/source |
| API key | your unified key |
| Model | `auto` (or `auto:<profile>`, or a specific model ID) |

The agent tool is not chosen yet (OpenCode, Cline, Aider or other). All project rules live in `AGENTS.md`, so any of them works.

## Rules
- Enter provider keys only in the router dashboard. Never in chat, never in git.
- Free providers may log prompts: no secrets, no private code.
- Free tiers change often; quality drops when top models hit daily caps. The router is for personal experiments.
- Judge AI output the same way regardless of model: run it, and break the app to confirm tests can fail.
