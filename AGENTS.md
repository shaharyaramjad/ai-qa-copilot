# AGENTS.md: instructions for any AI coding agent in this repo

(Works with Codex, OpenCode, Cursor, Aider, Cline, Claude Code and others. CLAUDE.md points here.)

## Project
Playwright + TypeScript test suite for https://www.saucedemo.com (public demo shop).
Goal: AC -> reviewed test cases -> Playwright tests, with human approval between steps.

## Commands
- Install: `npm install && npx playwright install chromium`
- Run all tests: `npx playwright test`
- Run one file: `npx playwright test tests/login.spec.ts`
- Typecheck: `npm run typecheck`
- Report: `npm run report`
- AI drafts (saved to `ai-output/`, human review required): `npm run ai:review -- <feature>`, `npm run ai:cases -- <feature>`, `npm run ai:automate -- <feature>`
- Check the free-model router: `npm run check:llm` (see `docs/setup/free-models.md`)

## Layout
- `docs/ac/`          acceptance criteria (input)
- `docs/test-cases/`  approved test case tables (Markdown)
- `pages/`            page objects, one class per page
- `tests/`            specs, one file per feature
- `prompts/`          reusable prompt templates
- `ai-output/`        AI drafts for human review (never merge or run without checking)

## Conventions
- Locators: `page.getByTestId(...)` (configured to the `data-test` attribute). Fall back to role/label. Never CSS or XPath chains.
- All selectors live in page objects, never in specs.
- Specs read like sentences: one behavior per test, name starts with the test case ID, e.g. `TC-LOGIN-01 valid user lands on inventory`.
- No `waitForTimeout`, no fixed sleeps. Use web-first assertions (`expect(locator).toBeVisible()`).
- No retries to hide flakiness. If a test is flaky, find the cause.
- Every test needs at least one assertion that can actually fail.

## Rules for the agent
- Never edit a test just to make it pass. If the app behaves wrongly, leave the test failing and report it.
- Explain the failure (with evidence: error, trace, diff) before changing code.
- Do not touch production or any site other than saucedemo.com.
- Stop and wait for approval after: (1) AC review, (2) test case table.
- Do not invent facts about the app. If unsure, open the app and check.

## Playwright agents (Step 4, run with `npm run agent`)
- Agents live in `.opencode/prompts/` (planner, generator, healer); the MCP server is set in `opencode.json`.
- Planner writes plans to `specs/`. I review the plan before the generator runs.
- Generated tests must use the page objects in `pages/` and follow the conventions above. Move any raw selectors into a page object.
- `tests/seed.spec.ts` is the agents' starting point (logs in). It is not a test case.
- The healer may fix selectors and timing, never expected results. If the app is wrong, the test stays failing.

## Gate, skill and plugin (Step 5)
- `npm run gate` = typecheck + all tests. Run it before saying you are done.
- `.opencode/plugins/test-gate.ts` runs the gate automatically when you finish after editing `tests/` or `pages/`, and sends failures back to you (max 2 rounds). It also blocks access to `.env`.
- `.opencode/skills/write-playwright-test/` is the step-by-step recipe for new tests. Load it before writing tests.

## Reviewer agent (Step 6)
- `.opencode/agents/test-reviewer.md` is read-only. `npm run review -- <spec file or folder>` runs it and saves the report to `ai-output/review-*.md`.
- `fixtures/bad-tests/` holds deliberately bad tests to check the reviewer. They are outside `tests/`, so the suite never runs them. Do not fix them.

## Flaky hunter (Step 6)
- `npm run flaky -- <spec> <test id> [runs] [workers]` runs one test many times in parallel and writes evidence to `ai-output/flaky-<id>.md`.
- `npm run hunt -- <spec> <test id>` does that, then asks the read-only `flaky-hunter` agent for the root cause and a proposed fix (it never applies it).
- `fixtures/flaky/` holds a deliberately flaky test (run through `playwright.fixtures.config.ts`). Do not fix it.

## Pipeline (Step 7)
- `npm run pipeline -- <feature>` runs the next stage and stops at two human gates: (1) you write verified answers to `docs/ac/<feature>.answers.md`, (2) you approve the drafted test cases with `--approve`.
- Stages: AI review of `docs/ac/<feature>.md` -> AI drafts test cases -> approved cases in `docs/test-cases/` -> AI writes `tests/<feature>.spec.ts` (missing page object methods are added in a separate step) -> typecheck, tests, reviewer agent, break-check -> `ai-output/<feature>-pipeline-report.md`.
- Never skip a gate, never approve cases for the human, never edit the approved cases to fit the tests.
- Expected values from an approved test case (names, prices, texts, counts) are asserted as literals in the spec. Never compute an expectation from the app's own output. `scripts/conformance.mjs` checks this and the pipeline runs it.

## CI (Step 8)
- `.github/workflows/tests.yml` runs typecheck, `npm run conformance:all` and the whole suite on every push and nightly. No AI calls, no secrets in CI. A red CI run is a signal to investigate, never to edit a test to get green.

## BDD (pilot on login)
- Gherkin lives in `features/*.feature`, steps in `steps/*.steps.ts`, run with `npm run bdd` (`playwright.bdd.config.ts`, playwright-bdd). Generated tests go to `.features-gen/` (git-ignored, never edit).
- Every scenario carries the approved test case ID as a tag (`@TC-LOGIN-01`). Expected values (error texts, names) are literal strings in the `.feature` file, taken from the approved test cases.
- Steps call page objects only (via fixtures in `steps/fixtures.ts`). No selectors or `page.locator` in steps. New action or check = new method in `pages/`.
- Step wording is reusable: one parametrised step (`I log in as {string} with password {string}`), not one step per scenario.
- Do not change an expected value in a `.feature` file to make a scenario pass.

## Forensics
- `npm run forensics` investigates failed tests and writes case files to `ai-output/forensics/` (generated, git-ignored; commit one with `git add -f` only as proof).
- Verdicts come from deterministic rules in `scripts/forensics.mjs`: environment, test code, selector, flaky (repeat runs), app bug likely (fails here, passes in the `--baseline` context).
- Forensics never edits tests or expected values. A failing assertion with a matching approved value is a bug report, not a test fix.

