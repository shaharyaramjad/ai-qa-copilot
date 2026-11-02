# Contributing to AI QA Copilot

Thank you for helping. The project tries to answer one hard question: **can you trust an AI-written test, and when a test fails, why?** Small, checkable contributions are the best kind.

## The one rule

**Never make a test pass by changing its expected value.** A failing test with a correct expected value is a bug report. Pull requests that weaken an assertion, add retries to hide flakiness, or loosen a check to get green will be declined.

## Set up (about 5 minutes)

```bash
git clone https://github.com/shaharyaramjad/ai-qa-copilot.git
cd ai-qa-copilot
npm install
npx playwright install chromium
npm run test:unit     # no browser, no network, no AI: must pass
npm run typecheck
npm test              # runs against saucedemo.com (needs internet)
```

You do not need an AI key to contribute. The AI steps (`npm run pipeline`, `npm run review`) need a free-model router, see `docs/setup/free-models.md`; the checks, forensics and CI do not.

## Where you can add things

| You want to add | Where | How it is checked |
|---|---|---|
| A **failure forensics rule** | one new file in `scripts/forensics/rules/` | `npm run test:unit` |
| A **trust check** (like conformance or break-check) | `scripts/` plus a line in `AGENTS.md` | a unit test or a fixture in `fixtures/` |
| An **example app** (feature, acceptance criteria, tests) | `docs/ac/`, `docs/test-cases/`, `tests/`, `pages/` | `npm run gate` and `npm run conformance:all` |
| A **prompt** improvement | `prompts/` | show before/after results in the PR |
| **Windows support** (a Node version of a `.sh` script) | `scripts/` | works on Windows, same output as the shell script |
| **Docs** | `README.md`, `docs/` | a reader can follow it |

### Adding a forensics rule

Rules are loaded in file-name order, and the first one that returns a verdict wins. A rule is one file:

```js
// scripts/forensics/rules/45-my-rule.mjs
export default {
  id: 'my-rule',
  describe: 'One sentence: what pattern this recognises.',
  match(ev, ctx) {
    // ev: evidence (message, expected, received, locator, ...), ctx: repeat and baseline results
    if (!/something specific/.test(ev.message)) return null;
    return { verdict: 'ENVIRONMENT', confidence: 'medium', why: 'Evidence-based reason.', next: 'What a human should do.' };
  },
};
```

Then add a test in `test/forensics.test.mjs` with a realistic error message. Rules must be deterministic (no AI calls, no network) and must say "likely" when they are not sure.

## Pull requests

1. Open an issue first for anything bigger than a small fix.
2. Keep the pull request to one change.
3. `npm run test:unit` and `npm run typecheck` pass. If you touched tests or page objects, `npm run gate` passes too.
4. Never commit keys. `.env` is git-ignored; `.env.example` has no real values.
5. Say what you checked and how. "Tests pass" is the weakest evidence in this project: show the failing case you used to prove the change works.

## Conventions

See `AGENTS.md` (selectors, page objects, expected values, BDD steps). Short version: `getByTestId` or role selectors, no fixed waits, expected values are literals from the approved test cases, steps never contain selectors.
