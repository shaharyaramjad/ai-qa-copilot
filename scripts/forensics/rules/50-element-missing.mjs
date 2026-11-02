import { LOCATOR } from '../patterns.mjs';
export default {
  id: 'element-missing',
  describe: 'The element was not found. If the same test passes in a baseline context, the app differs.',
  match(ev, ctx) {
    if (!LOCATOR.test(ev.message) || ctx.hasValues) return null;
    if (ctx.baseOk && ctx.stillFails) return { verdict: 'APP BUG (likely)', confidence: 'medium', why: `The element is missing in this context but the same test passes in the baseline (${ctx.base.label}).`, next: 'Compare the page in both contexts (screenshot, trace). If the element should be there, file a bug.' };
    return { verdict: 'TEST (SELECTOR OR TIMING) OR APP CHANGE', confidence: 'medium', why: 'The element was not found within the timeout and there is no expected-versus-received value.', next: 'Open the trace and screenshot: is the element gone, renamed, or just slow? Try `npm run agent` healer for selector changes only.' };
  },
};
