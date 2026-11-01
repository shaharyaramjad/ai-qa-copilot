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
