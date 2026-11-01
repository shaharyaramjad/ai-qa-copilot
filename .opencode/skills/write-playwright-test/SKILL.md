---
name: write-playwright-test
description: Use when asked to write, add or change Playwright tests in this repo. Gives the exact steps and conventions so every test is reviewed, uses page objects, and is proven to fail when the app is wrong.
---

# Write a Playwright test (this repo)

## Steps
1. Read the approved test cases in `docs/test-cases/<feature>.md` or the plan in `specs/`. Do not invent cases.
2. Read `AGENTS.md` and the existing page objects in `pages/`. Reuse methods. Add a method to a page object if one is missing; never put selectors in a spec.
3. Open the real app (Playwright MCP tools) to confirm texts, URLs and values before asserting them.
4. Write `tests/<feature>.spec.ts`: one behavior per test, name starts with the ID, e.g. `TC-CART-08 ...`.
5. Run `npm run gate` (typecheck + whole suite). Fix failures in selectors or timing only.
6. Prove the test can fail: `npm run break-check -- tests/<file> <TEST-ID>` must end with `RESULT: PASS`.
7. Report: tests added, gate result, break-check result. Stop and wait for review.

## Never
- Edit an expected value, remove an assertion, add `test.skip`/`fixme` or retries to get green.
- Use `waitForTimeout` or fixed sleeps. Give slow pages a longer timeout on the assertion instead.
- Read or print `.env`.
