#!/usr/bin/env node
// Failure forensics: for every failed test, build a "case file" with the evidence and a verdict.
//   npm run forensics                                   run the suite, investigate every failure
//   npm run forensics -- tests/sorting.spec.ts           only one spec
//   npm run forensics -- tests/sorting.spec.ts --baseline SAUCE_USER=standard_user
//                                                       re-run each failure in a known-good context (differential test)
//   npm run forensics -- --repeat 8                      re-runs per failure to detect flakiness (default 5)
//   npm run forensics -- --from report.json              analyse an existing Playwright JSON report (no re-runs)
// Output: ai-output/forensics/<test id>.md and ai-output/forensics/summary.md
// Rules live in scripts/forensics/rules/ (one file per rule). Forensics never edits tests or expected values.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReport, isFailed, testId, evidence, strip } from './forensics/evidence.mjs';
import { judge } from './forensics/judge.mjs';
import { NETWORK, CODE } from './forensics/patterns.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'ai-output/forensics');

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

// ---------- case file ----------
const code = (s) => '```\n' + s + '\n```';
function caseFile(t, ev, v, rerun, base) {
  const L = [];
  L.push(`# Case file: ${t.title}`, '', `Spec: \`${t.file}\``, '');
  L.push(`## Verdict: ${v.verdict} (confidence: ${v.confidence})`, '', v.why, '', `**Next step:** ${v.next}`, '', `Rule that decided: \`${v.rule}\``, '');
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
  const ev = evidence(t, ROOT);
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
