# Starter issues

Copy each one into a GitHub issue (label `good first issue`). Difficulty: S = a few hours, M = a day, L = several days.

| # | Issue | Size | Done when |
|---|---|---|---|
| 1 | Forensics rule: HTTP 5xx or failed API response before the failure (read the trace network log) | M | Unit test with a sample trace; verdict ENVIRONMENT or APP BUG (likely) |
| 2 | Forensics rule: console error on the page before the failure | M | Unit test; evidence line in the case file |
| 3 | Forensics: `--json` output next to the Markdown case files | S | Valid JSON per failure, documented in README |
| 4 | Windows: Node version of `scripts/break-check.sh` | M | Same output on Windows, Mac and Linux |
| 5 | Windows: Node versions of `gate.sh`, `bug-demo.sh`, `conformance-all.sh` | M | `npm run gate` works on Windows |
| 6 | Break-all score: `npm run break-all` breaks every test's expected value one at a time and prints "N of M tests can fail" | M | Score printed; unbreakable tests listed |
| 7 | Traceability matrix: report mapping each acceptance criterion to test cases and tests, flagging uncovered criteria | M | `ai-output/traceability.md` for the four demo features |
| 8 | Lint rule (no AI): flag `waitForTimeout` and raw CSS/XPath selectors in `tests/` | S | Fails on the planted bad specs in `fixtures/bad-tests/` |
| 9 | Second example app: acceptance criteria, approved test cases, page objects and tests for a different public demo site | L | `npm run gate` and `npm run conformance:all` pass for it |
| 10 | One config file (`qa.config.json`) for base URL, test id attribute and login user instead of SauceDemo values spread across files | L | Pointing it at another app needs no code edits |
| 11 | Docs: an architecture diagram of the pipeline and its human gates | S | Diagram in the README, correct against `scripts/pipeline.mjs` |
| 12 | BDD: extend `features/` and `steps/` from login to cart | M | Scenarios tagged with the approved IDs, `npm run bdd` passes |
