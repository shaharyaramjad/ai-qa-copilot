#!/usr/bin/env node
// Failure forensics: for every failed test, build a "case file" with the evidence and a verdict.
//   npm run forensics                                   run the suite, investigate every failure
//   npm run forensics -- tests/sorting.spec.ts           only one spec
//   npm run forensics -- tests/sorting.spec.ts --baseline SAUCE_USER=standard_user
//                                                       re-run each failure in a known-good context (differential test)
//   npm run forensics -- --repeat 8                      re-runs per failure to detect flakiness (default 5)
//   npm run forensics -- --from report.json              analyse an existing Playwright JSON report (no re-runs)
// Output: ai-output/forensics/<test id>.md and ai-output/forensics/summary.md
// Rule: forensics explains failures. It never edits tests or expected values.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'ai-output/forensics');
const ANSI = /\u001b\[[0-9;]*m/g;
const strip = (s = '') => String(s).replace(ANSI, '');

// ---------- arguments ----------
const args = process.argv.slice(2);
let from = null, baseline = null, repeat = 5; const passthrough = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from') from = args[++i];
  else if (args[i] === '--baseline') baseline = args[++i];
  else if (args[i] === '--repeat') repeat = Number(args[++i]);
  else passthrough.push(args[i]);
}
if (baseline && !/^[A-Za-z_][A-Za-z0-9_]*=.+$/.test(baseline)) { console.error('--baseline needs KEY=value, e.g. SAUCE_USER=standard_user'); process.exit(2); }

// ---------- reading Playwright's JSON report ----------
function walk(suite, file, acc) {
  const f = suite.file || file;
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const results = t.results || [];
      const last = results[results.length - 1] || {};
      acc.push({ file: spec.file || f, title: spec.title, project: t.projectName, status: t.status, results, last });
    }
  }
  for (const s of suite.suites || []) walk(s, f, acc);
}
function parseReport(json) { const acc = []; for (const s of json.suites || []) walk(s, s.file, acc); return acc; }
const isFailed = (t) => t.status === 'unexpected' || t.status === 'flaky' || ['failed', 'timedOut'].includes(t.last.status);
const testId = (title) => (title.match(/\bTC-[A-Z0-9]+-\d+\b/) || [title.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40)])[0];

function runPlaywright(extra, env = {}) {
  const r = spawnSync('npx', ['playwright', 'test', ...extra, '--reporter=json'], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 200 * 1024 * 1024, env: { ...process.env, ...env, PLAYWRIGHT_HTML_OPEN: 'never' },
  });
  const out = r.stdout || '';
  const start = out.indexOf('{');
  if (start < 0) return { error: strip(r.stderr || out).slice(0, 800) || 'no JSON from Playwright', tests: [] };
  try { return { tests: parseReport(JSON.parse(out.slice(start))), stderr: r.stderr || '' }; }
  catch (e) { return { error: 'could not read the JSON report: ' + e.message, tests: [] }; }
}

// ---------- evidence from one failed result ----------
function evidence(t) {
  const r = t.last;
  const err = (r.errors && r.errors[0]) || r.error || {};
  const message = strip(err.message || '');
  const stack = strip(err.stack || '');
  const grab = (re) => { const m = message.match(re); return m ? m[1].trim() : null; };
  let expected = null, received = null, diff = null;
  const pair = message.match(/Expected[^:\n]*:\s*([\s\S]*?)\n\s*Received[^:\n]*:\s*([\s\S]*?)(?:\n\s*\n|\n\s*Call log|$)/);
  if (pair) { expected = pair[1].trim(); received = pair[2].trim(); }
  if (received && /element\(s\) not found/.test(received)) { expected = null; received = null; } // missing element, not a value mismatch
  const diffLines = message.split('\n').filter((l) => /^\s*[-+]\s/.test(l) || /^\s*[-+] (Expected|Received)/.test(l));
  if (diffLines.length) diff = diffLines.slice(0, 24).join('\n');
  const matcher = ((message.match(/expect\([^)]*\)\.(not\.)?\w+/) || [])[0]) || null;
  const attachments = (r.attachments || []).filter((a) => a.path).map((a) => ({ name: a.name, path: a.path }));
  return {
    message: message.split('\n').slice(0, 14).join('\n'),
    matcher, expected, received, diff,
    locator: grab(/Locator:\s*(.+)/),
    timeout: grab(/(?:Timeout|Test timeout of)[: ]+(\d+)\s*ms/),
    line: err.location ? `${err.location.file ? err.location.file.replace(ROOT + '/', '') : t.file}:${err.location.line}` : (stack.match(/\(?([^\s()]+\.ts:\d+):\d+\)?/) || [])[1] || null,
    snippet: strip(err.snippet || ''),
    screenshot: (attachments.find((a) => a.name === 'screenshot') || {}).path || null,
    trace: (attachments.find((a) => a.name === 'trace') || {}).path || null,
    stderr: strip((r.stderr || []).map((x) => x.text || '').join('')).slice(0, 400),
    durationMs: r.duration || null,
  };
}

// ---------- verdict ----------
const NETWORK = /net::ERR_|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|socket hang up/;
const CODE = /\b(TypeError|ReferenceError|SyntaxError)\b|Cannot find module|is not a function|is not defined/;
const LOCATOR = /strict mode violation|waiting for (getBy|locator)|element\(s\) not found|Locator:/;
function judge(ev, rerun, base) {
  const text = ev.message + '\n' + ev.stderr;
  const hasValues = !!((ev.expected && ev.received) || ev.diff);
  const flakyPartial = rerun && rerun.runs > 1 && rerun.passes > 0 && rerun.passes < rerun.runs;
  const stillFails = !rerun || rerun.runs < 2 || rerun.passes === 0;
  const baseOk = base && base.runs > 0 && base.passes === base.runs;
  if (NETWORK.test(text)) return { verdict: 'ENVIRONMENT', confidence: 'high', why: 'The error is a network failure (the site or the connection), not a test or app result.', next: 'Check the connection and that the site is up, then re-run. Do not edit the test.' };
  if (CODE.test(ev.message)) return { verdict: 'TEST CODE', confidence: 'high', why: 'The error is a code error in the test or a page object, not an assertion about the app.', next: 'Fix the code at the line shown. Run typecheck.' };
  if (flakyPartial) return { verdict: 'FLAKY', confidence: 'high', why: `Passed ${rerun.passes} of ${rerun.runs} identical re-runs, so the result is not deterministic.`, next: 'Find what varies between runs (data, timing, shared state). Use `npm run hunt` for the root cause. Do not add retries.' };
  if (/strict mode violation/.test(ev.message)) return { verdict: 'TEST (SELECTOR)', confidence: 'high', why: 'The locator matches more than one element.', next: 'Make the locator specific in the page object.' };
  if (LOCATOR.test(ev.message) && !hasValues) {
    if (baseOk && stillFails) return { verdict: 'APP BUG (likely)', confidence: 'medium', why: `The element is missing in this context but the same test passes in the baseline (${base.label}).`, next: 'Compare the page in both contexts (screenshot, trace). If the element should be there, file a bug.' };
    return { verdict: 'TEST (SELECTOR OR TIMING) OR APP CHANGE', confidence: 'medium', why: 'The element was not found within the timeout and there is no expected-versus-received value.', next: 'Open the trace and screenshot: is the element gone, renamed, or just slow? Try `npm run agent` healer for selector changes only.' };
  }
  if (hasValues) {
    if (baseOk && stillFails) return { verdict: 'APP BUG (likely)', confidence: 'high', why: `Deterministic failure, and the same test passes in the baseline (${base.label}). The app behaves differently for this input and the approved expected value is right.`, next: 'File a bug with the expected-versus-received evidence below. Do not change the expected value.' };
    if (base && !baseOk) return { verdict: 'EXPECTED VALUE OR APP BUG IN ALL CONTEXTS', confidence: 'medium', why: `The test also fails in the baseline (${base.label}).`, next: 'Check the expected value against the approved test case first, then the app.' };
    return { verdict: 'APP BUG OR WRONG EXPECTED VALUE (human decides)', confidence: 'medium', why: 'Deterministic mismatch between expected and received. Without a baseline run the script cannot tell which side is wrong.', next: 'Compare the expected value with the approved test case. If it matches, it is an app bug. Re-run with --baseline for a second opinion.' };
  }
  return { verdict: 'UNKNOWN', confidence: 'low', why: 'The failure does not match a known pattern.', next: 'Read the error and open the trace.' };
}

// ---------- case file ----------
const code = (s) => '```\n' + s + '\n```';
function caseFile(t, ev, v, rerun, base) {
  const L = [];
  L.push(`# Case file: ${t.title}`, '', `Spec: \`${t.file}\``, '');
  L.push(`## Verdict: ${v.verdict} (confidence: ${v.confidence})`, '', v.why, '', `**Next step:** ${v.next}`, '');
  L.push('## Evidence', '');
  L.push('| Check | Result |', '|---|---|');
  L.push(`| Failing line | ${ev.line ? '`' + ev.line + '`' : 'not available'} |`);
  L.push(`| Assertion | ${ev.matcher ? '`' + ev.matcher + '`' : 'not an assertion error'} |`);
  if (ev.locator) L.push(`| Locator | \`${ev.locator}\` |`);
  if (ev.timeout) L.push(`| Timeout | ${ev.timeout} ms |`);
  L.push(`| Repeat runs | ${rerun ? `${rerun.passes} passed of ${rerun.runs}` : 'not run'} |`);
  L.push(`| Baseline${base ? ' (' + base.label + ')' : ''} | ${base ? `${base.passes} passed of ${base.runs}` : 'not run'} |`);
  L.push(`| Screenshot | ${ev.screenshot ? '`' + ev.screenshot + '`' : 'none saved'} |`);
  L.push(`| Trace | ${ev.trace ? '`npx playwright show-trace ' + ev.trace + '`' : 'none saved'} |`, '');
  if (ev.expected && ev.received) L.push('## Expected versus received', '', 'Expected:', code(ev.expected), 'Received:', code(ev.received), '');
  else if (ev.diff) L.push('## Difference (- expected, + received)', '', code(ev.diff), '');
  L.push('## Error message', '', code(ev.message || '(empty)'), '');
  if (ev.snippet) L.push('## Code around the failure', '', code(ev.snippet), '');
  L.push('_Forensics explains failures. It never edits tests or expected values._', '');
  return L.join('\n');
}

// ---------- main ----------
mkdirSync(OUT, { recursive: true });
let tests;
if (from) {
  tests = parseReport(JSON.parse(readFileSync(resolve(ROOT, from), 'utf8')));
  console.log(`Reading ${from} (no re-runs in this mode).`);
} else {
  console.log('Running the suite...');
  const run = runPlaywright(passthrough);
  if (run.error) { console.error('Could not run Playwright: ' + run.error); process.exit(2); }
  tests = run.tests;
}
const failed = tests.filter(isFailed);
console.log(`${tests.length} tests, ${failed.length} failed.`);
const rows = [];
for (const t of failed) {
  const id = testId(t.title);
  const ev = evidence(t);
  let rerun = null, base = null;
  if (!from && !NETWORK.test(ev.message) && !CODE.test(ev.message)) {
    const grep = ['-g', id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')];
    if (repeat > 1) { console.log(`  ${id}: re-running ${repeat} times...`); const r = runPlaywright([t.file, ...grep, '--repeat-each', String(repeat)]); if (!r.error) rerun = { runs: r.tests.length, passes: r.tests.filter((x) => x.last.status === 'passed').length }; }
    if (baseline) { const [k, ...vv] = baseline.split('='); console.log(`  ${id}: baseline ${baseline}...`); const r = runPlaywright([t.file, ...grep], { [k]: vv.join('=') }); if (!r.error) base = { label: baseline, runs: r.tests.length, passes: r.tests.filter((x) => x.last.status === 'passed').length }; }
  }
  const v = judge(ev, rerun, base);
  writeFileSync(resolve(OUT, `${id}.md`), caseFile(t, ev, v, rerun, base));
  rows.push({ id, title: t.title, v });
  console.log(`  ${id}: ${v.verdict} (${v.confidence})`);
}
const sum = ['# Forensics summary', '', `Generated ${new Date().toISOString()}`, '', `${tests.length} tests, ${failed.length} failed.`, ''];
if (rows.length) { sum.push('| Test | Verdict | Confidence | Case file |', '|---|---|---|---|'); for (const r of rows) sum.push(`| ${r.title} | ${r.v.verdict} | ${r.v.confidence} | \`ai-output/forensics/${r.id}.md\` |`); }
else sum.push('No failures to investigate.');
writeFileSync(resolve(OUT, 'summary.md'), sum.join('\n') + '\n');
console.log(`\nCase files: ai-output/forensics/ (start with summary.md)`);
process.exit(failed.length ? 1 : 0);
