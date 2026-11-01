# AI QA Copilot

Personal project: an AI-assisted QA workflow in Playwright + TypeScript.
Pipeline: **acceptance criteria -> reviewed test cases -> Playwright tests**, with a human approval between steps.

Target app: https://www.saucedemo.com (public demo shop).

## Quick start

```bash
npm install
npx playwright install chromium
npx playwright test
npm run report
```

## AI commands (free models via the router)

Setup once: `cp .env.example .env`, paste your router key into `LLM_API_KEY`, then `npm run check:llm`. Details in `docs/setup/free-models.md`.

| Command | What it does | Saves to |
|---|---|---|
| `npm run ai:review -- cart` | Finds gaps in `docs/ac/cart.md`, as questions | `ai-output/cart-ac-review.md` |
| `npm run ai:cases -- cart` | Writes test cases from the AC (and `docs/ac/cart.answers.md` if present) | `ai-output/cart-test-cases.md` |
| `npm run ai:automate -- cart` | Writes a Playwright spec from `docs/test-cases/cart.md` | `ai-output/cart.spec.ts` |

Add a number to repeat a run, for example `npm run ai:review -- cart 3`. Outputs are drafts: review them, run them, and break the app to confirm tests can fail. `DRY=1 npm run ai:review -- cart` shows the prompt size without calling a model.

Prove a test can fail: `npm run break-check` breaks one expectation on purpose, runs the test (it must fail), then restores the file. Use `npm run break-check -- tests/checkout.spec.ts TC-CHK-05` for another test.

## Roadmap

| Step | What | Status |
|---|---|---|
| 0 | Repo setup, AGENTS.md, first page objects and login tests | done (6/6 pass) |
| 1 | Manual baseline: AC + hand-written tests for 3 features (login, cart, checkout) | done (20/20 pass) |
| 2 | Free model router (FreeLLMAPI), see `docs/setup/free-models.md` | done |
| 3 | Prompt templates and AI commands (`npm run ai:*`) | done |
| 4 | Playwright agents (planner/generator/healer) via OpenCode + free router: `npm run agent` | done (healer to try) |
| 5 | Skills + hooks (run tests before the agent can finish) | todo |
| 6 | Custom agents: test reviewer, flaky hunter | todo |
| 7 | One-prompt pipeline AC -> tests | todo |
| 8 | CI (GitHub Actions) + bug report / maintenance agents | todo |
| 9 | Prove it: break the app, measure time saved, pitch | todo |

## Working with any AI tool

All agent rules live in `AGENTS.md`, read by Codex, OpenCode, Cursor, Aider, Cline and Claude Code.
Switching models or tools does not change the project rules.
