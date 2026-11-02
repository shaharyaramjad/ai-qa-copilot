import { NETWORK } from '../patterns.mjs';
export default {
  id: 'environment',
  describe: 'A network failure is not a test or app result.',
  match: (ev, ctx) => NETWORK.test(ctx.text) && { verdict: 'ENVIRONMENT', confidence: 'high', why: 'The error is a network failure (the site or the connection), not a test or app result.', next: 'Check the connection and that the site is up, then re-run. Do not edit the test.' },
};
