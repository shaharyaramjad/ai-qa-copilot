# AI QA Copilot

![tests](https://github.com/shaharyaramjad/ai-qa-copilot/actions/workflows/tests.yml/badge.svg)

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

## Commands

| Command | What it does |
|---|---|
| `npm run pipeline -- <feature>` | AC -> AI review -> (you answer) -> test cases -> (you approve with `--approve`) -> tests -> checks -> report. Resumable; `--status` shows where you are. |
| `npm run gate` | Typecheck + the whole suite. Exit 0 only if both pass. |
| `npm run review -- <spec>` | Read-only reviewer agent flags weak tests (no assertion, cannot fail, raw selectors, fixed waits, expectation computed from the app's own output). |
| `npm run flaky -- <spec> <id>` | Runs one test many times in parallel and writes evidence. |
| `npm run hunt -- <spec> <id>` | Same, then the flaky-hunter agent names the root cause. It proposes a fix but never applies it. |
| `npm run conformance -- <spec> <cases>` | Checks a spec asserts the concrete values from the approved test cases. |
| `npm run bdd` | BDD suite (pilot): runs the Gherkin scenarios in `features/` through `steps/` and the page objects. Separate report in `playwright-report-bdd/`. |
| `npm run bug-demo` | Runs the sorting tests as `standard_user` and as `problem_user` (SauceDemo's buggy user). |
| `npm run agent` | Opens OpenCode with the Playwright planner, generator and healer. |

## BDD and page objects (pilot on login)

Two layers, kept apart:

| Layer | Where | Job |
|---|---|---|
| Scenarios (Given / When / Then) | `features/login.feature` | Readable behaviour, one tag per approved test case (`@TC-LOGIN-01` ...) |
| Steps | `steps/*.steps.ts` | Plain-English sentences wired to code. No selectors here. |
| Page objects | `pages/*.ts` | Selectors and actions. Know nothing about Gherkin. |

`steps/fixtures.ts` hands the page objects to the steps as fixtures. Run with `npm run bdd`; it uses `playwright.bdd.config.ts` (tool: playwright-bdd), so the 31 classic tests and CI are untouched. Prove a scenario can fail: change one quoted value in the `.feature` (e.g. `"locked out"` to `"locked in"`), run `npm run bdd -- --grep TC-LOGIN-05`, it must fail, then undo.

## CI

`.github/workflows/tests.yml` runs on every push to `main`, on pull requests and once a night (to notice when the demo site changes): typecheck, `npm run conformance:all` (every feature's tests must assert the values in its approved test cases), then all Playwright tests. The HTML report is uploaded as an artifact. CI makes no AI calls and uses no secrets.

## Without and with the pipeline

| Step | By hand | With AI QA Copilot |
|---|---|---|
| Read the acceptance criteria for gaps | You read them | AI lists questions, you answer (gate 1) |
| Write test cases | You write them | AI drafts, you edit and approve (gate 2) |
| Write the Playwright spec and page objects | You write them | AI drafts them; typecheck and tests run at once |
| Trust the result | "It passes" | Conformance (every approved value is asserted), break-check (the test can fail), reviewer agent, CI |
| Prove it catches bugs | Rarely done | `npm run bug-demo`: 4 of 8 sorting tests fail on a buggy user |

Measured: AI working time for the sorting feature was about 3.5 minutes (review, cases, tests, page objects). I have not yet timed the same feature by hand, so I make no "time saved" claim until I do.

## Proof so far (from real runs)

- 31 tests plus a login seed for the agents; all pass for `standard_user`.
- `break-check`: breaking one expected value makes the test fail (checked on cart, login and sorting tests).
- Planner -> my review -> generator produced 3 passing login tests; healer fixed a renamed test id by changing one line in a page object.
- Reviewer agent found every planted problem in 4 deliberately bad specs, with 0 false alarms on clean tests. Flaky hunter found the planted cause (random test data) and said STABLE on stable tests.
- Pipeline on product sorting: first AI tests passed but compared the app with itself (conformance 1 of 7); after a stricter prompt and review 7 of 7.
- `bug-demo`: as `problem_user`, 4 of 8 sorting tests fail on the real sort bug; the other 4 correctly pass.

## Known limits

- Free models hit rate limits. The reviewer needs tool-calling models and can run out of quota; the pipeline then says so and does not call the run green.
- Only SauceDemo features are covered (login, cart, checkout, sorting).
- Free-model quality varies: always read the drafts at the two human gates.

## Roadmap

| Step | What | Status |
|---|---|---|
| 0 | Repo setup, AGENTS.md, first page objects and login tests | done |
| 1 | Manual baseline: AC + hand-written tests for login, cart, checkout | done |
| 2 | Free model router (FreeLLMAPI), see `docs/setup/free-models.md` | done |
| 3 | Prompt templates and AI commands (`npm run ai:*`) | done |
| 4 | Playwright agents (planner/generator/healer) via OpenCode | done (healer verified) |
| 5 | Skills + hooks: gate script, gate plugin, write-playwright-test skill | done (plugin pop-ups not yet confirmed) |
| 6 | Custom agents: test reviewer, flaky hunter | done |
| 7 | One-command pipeline with 2 human gates | done (reviewer step waits for free quota) |
| 8 | CI (GitHub Actions): typecheck, conformance, tests on every push and nightly. Bug report / maintenance agents still todo | CI built, first run on GitHub pending |
| 9 | Prove it: break the app (bug demo done), measure time saved, pitch | in progress |
| 10 | Package as a starter kit (one-click setup, docs, license) | todo |

## Working with any AI tool

All agent rules live in `AGENTS.md`, read by Codex, OpenCode, Cursor, Aider, Cline and Claude Code.
Switching models or tools does not change the project rules.
