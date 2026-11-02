export default {
  id: 'flaky',
  describe: 'The same test passes in some identical re-runs, so the result is not deterministic.',
  match: (ev, ctx) => ctx.flakyPartial && { verdict: 'FLAKY', confidence: 'high', why: `Passed ${ctx.rerun.passes} of ${ctx.rerun.runs} identical re-runs, so the result is not deterministic.`, next: 'Find what varies between runs (data, timing, shared state). Use `npm run hunt` for the root cause. Do not add retries.' },
};
