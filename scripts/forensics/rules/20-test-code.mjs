import { CODE } from '../patterns.mjs';
export default {
  id: 'test-code',
  describe: 'A ReferenceError or TypeError is a bug in the test code, not an assertion about the app.',
  match: (ev) => CODE.test(ev.message) && { verdict: 'TEST CODE', confidence: 'high', why: 'The error is a code error in the test or a page object, not an assertion about the app.', next: 'Fix the code at the line shown. Run typecheck.' },
};
