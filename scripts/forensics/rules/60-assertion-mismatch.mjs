export default {
  id: 'assertion-mismatch',
  describe: 'Expected and received differ. A baseline run decides whether the app or the expected value is wrong.',
  match(ev, ctx) {
    if (!ctx.hasValues) return null;
    if (ctx.baseOk && ctx.stillFails) return { verdict: 'APP BUG (likely)', confidence: 'high', why: `Deterministic failure, and the same test passes in the baseline (${ctx.base.label}). The app behaves differently for this input and the approved expected value is right.`, next: 'File a bug with the expected-versus-received evidence below. Do not change the expected value.' };
    if (ctx.base && !ctx.baseOk) return { verdict: 'EXPECTED VALUE OR APP BUG IN ALL CONTEXTS', confidence: 'medium', why: `The test also fails in the baseline (${ctx.base.label}).`, next: 'Check the expected value against the approved test case first, then the app.' };
    return { verdict: 'APP BUG OR WRONG EXPECTED VALUE (human decides)', confidence: 'medium', why: 'Deterministic mismatch between expected and received. Without a baseline run the script cannot tell which side is wrong.', next: 'Compare the expected value with the approved test case. If it matches, it is an app bug. Re-run with --baseline for a second opinion.' };
  },
};
