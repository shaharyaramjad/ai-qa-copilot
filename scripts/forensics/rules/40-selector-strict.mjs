export default {
  id: 'selector-strict',
  describe: 'A locator that resolves to several elements is a test problem.',
  match: (ev) => /strict mode violation/.test(ev.message) && { verdict: 'TEST (SELECTOR)', confidence: 'high', why: 'The locator matches more than one element.', next: 'Make the locator specific in the page object.' },
};
