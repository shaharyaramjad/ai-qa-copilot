// Unit tests for failure forensics. No browser, no network, no AI: run with `npm run test:unit`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseReport, isFailed, testId, evidence } from '../scripts/forensics/evidence.mjs';
import { judge, rules } from '../scripts/forensics/judge.mjs';

const report = JSON.parse(readFileSync(new URL('../fixtures/forensics/sample-report.json', import.meta.url), 'utf8'));
const OK_BASE = { runs: 1, passes: 1, label: 'SAUCE_USER=standard_user' };
const BAD_BASE = { runs: 1, passes: 0, label: 'SAUCE_USER=standard_user' };
const values = { message: 'Error: expect(received).toEqual(expected)', expected: '[a,b]', received: '[b,a]', diff: null, stderr: '' };

test('every rule file has an id, a description and a match function', () => {
  assert.ok(rules.length >= 6);
  const ids = new Set();
  for (const r of rules) {
    assert.equal(typeof r.id, 'string', r.file);
    assert.equal(typeof r.describe, 'string', r.file);
    assert.equal(typeof r.match, 'function', r.file);
    assert.ok(!ids.has(r.id), 'duplicate rule id ' + r.id);
    ids.add(r.id);
  }
});

test('sample report: right verdict for each kind of failure', () => {
  const tests = parseReport(report);
  assert.equal(tests.length, 7);
  const failed = tests.filter(isFailed);
  assert.equal(failed.length, 6);
  const verdicts = Object.fromEntries(failed.map((t) => [testId(t.title), judge(evidence(t), null, null).verdict]));
  assert.deepEqual(verdicts, {
    'TC-SORT-03': 'APP BUG OR WRONG EXPECTED VALUE (human decides)',
    'TC-SORT-04': 'APP BUG OR WRONG EXPECTED VALUE (human decides)',
    'TC-SORT-07': 'ENVIRONMENT',
    'TC-SORT-08': 'TEST (SELECTOR OR TIMING) OR APP CHANGE',
    'TC-SORT-09': 'TEST (SELECTOR)',
    'TC-SORT-10': 'TEST CODE',
  });
});

test('evidence: expected and received are extracted from the message', () => {
  const t = parseReport(report).find((x) => x.title.startsWith('TC-SORT-04'));
  const ev = evidence(t);
  assert.equal(ev.expected, '[7.99, 9.99, 15.99, 15.99, 29.99, 49.99]');
  assert.equal(ev.received, '[29.99, 9.99, 15.99, 49.99, 7.99, 15.99]');
  assert.equal(ev.matcher, 'expect(received).toEqual');
});

test('a missing element is not mistaken for a value mismatch', () => {
  const t = parseReport(report).find((x) => x.title.startsWith('TC-SORT-08'));
  const ev = evidence(t);
  assert.equal(ev.expected, null);
  assert.equal(ev.received, null);
  assert.equal(ev.locator, "getByTestId('product-sort-container')");
});

test('repeat runs and baseline change the verdict', () => {
  assert.equal(judge(values, { runs: 5, passes: 0 }, OK_BASE).verdict, 'APP BUG (likely)');
  assert.equal(judge(values, { runs: 5, passes: 0 }, OK_BASE).confidence, 'high');
  assert.equal(judge(values, { runs: 5, passes: 3 }, null).verdict, 'FLAKY');
  assert.equal(judge(values, { runs: 5, passes: 0 }, BAD_BASE).verdict, 'EXPECTED VALUE OR APP BUG IN ALL CONTEXTS');
  assert.equal(judge(values, null, null).verdict, 'APP BUG OR WRONG EXPECTED VALUE (human decides)');
});

test('missing element plus passing baseline points to the app', () => {
  const ev = { message: 'expect(locator).toBeVisible() failed\nLocator: getByTestId(x)\nTimeout: 5000ms', stderr: '' };
  assert.equal(judge(ev, { runs: 5, passes: 0 }, OK_BASE).verdict, 'APP BUG (likely)');
});

test('network errors win over everything else', () => {
  const ev = { ...values, message: 'page.goto: net::ERR_TIMED_OUT', stderr: '' };
  assert.equal(judge(ev, { runs: 5, passes: 0 }, OK_BASE).verdict, 'ENVIRONMENT');
});

test('unknown failures get a low-confidence UNKNOWN verdict', () => {
  const v = judge({ message: 'something odd', stderr: '' }, null, null);
  assert.equal(v.verdict, 'UNKNOWN');
  assert.equal(v.confidence, 'low');
});
