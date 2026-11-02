#!/usr/bin/env node
// One-command QA pipeline: AC -> AI review -> (you answer) -> test cases -> (you approve) -> tests -> checks -> report.
// It is resumable: run the same command again and it continues at the next stage. It stops at the two human gates.
//
//   npm run pipeline -- <feature>             run the next stage
//   npm run pipeline -- <feature> --approve   approve the drafted test cases (gate 2) and continue
//   npm run pipeline -- <feature> --status    show where the feature is
//   npm run pipeline -- <feature> --redo-cases  throw away the drafted test cases and ask the AI again
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const args = process.argv.slice(2);
const feature = args.find((a) => !a.startsWith('--'));
const has = (f) => args.includes(`--${f}`);
const DRY = !!process.env.PIPELINE_DRY;
const say = (s = '') => console.log(s);
const fail = (m) => { console.error(`\nError: ${m}`); process.exit(1); };

if (!feature) fail('Usage: npm run pipeline -- <feature> [--approve | --status | --redo-cases]   e.g. npm run pipeline -- sorting');

// load .env (router address and key) so child processes see it
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const P = {
  ac: `docs/ac/${feature}.md`,
  answers: `docs/ac/${feature}.answers.md`,
  review: `ai-output/${feature}-ac-review.md`,
  draft: `ai-output/${feature}-test-cases.md`,
  approved: `docs/test-cases/${feature}.md`,
  aiSpec: `ai-output/${feature}.spec.ts`,
  spec: `tests/${feature}.spec.ts`,
  state: `ai-output/${feature}-pipeline.json`,
  report: `ai-output/${feature}-pipeline-report.md`,
};
mkdirSync('ai-output', { recursive: true });
const state = existsSync(P.state) ? JSON.parse(readFileSync(P.state, 'utf8')) : { events: [] };
const save = () => writeFileSync(P.state, JSON.stringify(state, null, 2));
const mark = (stage, seconds = 0, note = '') => { state.events.push({ stage, at: new Date().toISOString(), seconds: Math.round(seconds), note }); save(); };

function sh(cmd, argv, { show = true } = {}) {
  const t = Date.now();
  const r = spawnSync(cmd, argv, { encoding: 'utf8', env: process.env, maxBuffer: 50 * 1024 * 1024 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (show) process.stdout.write(out);
  return { code: r.status ?? 1, out, seconds: (Date.now() - t) / 1000 };
}
function model(label, argv) {
  say(`\n--- ${label} ---`);
  if (DRY) { say(`(dry run) would run: ${argv.join(' ')}`); return { code: 0, seconds: 0 }; }
  const t = Date.now();
  const r = spawnSync(argv[0], argv.slice(1), { stdio: 'inherit', env: process.env });
  return { code: r.status ?? 1, seconds: (Date.now() - t) / 1000 };
}
const todos = (file) => (readFileSync(file, 'utf8').match(/TODO: needs page object method[^\n]*/g) ?? []);
const ids = (file) => [...readFileSync(file, 'utf8').matchAll(/test(?:\.skip)?\(\s*['"`](TC-[A-Z]+-\d+)/g)].map((m) => m[1]);
const stripStamp = (text) => text.replace(/^<!--[\s\S]*?-->\s*/, '');

// ---------------- status ----------------
const done = (cond) => (cond ? 'done  ' : 'todo  ');
function status() {
  say(`\nFeature: ${feature}`);
  say(`  ${done(existsSync(P.ac))} 0. Acceptance criteria        ${P.ac}`);
  say(`  ${done(existsSync(P.review))} 1. AI review of the criteria  ${P.review}`);
  say(`  ${done(existsSync(P.answers))} GATE 1 (you): answers          ${P.answers}`);
  say(`  ${done(existsSync(P.draft))} 2. AI drafts test cases       ${P.draft}`);
  say(`  ${done(existsSync(P.approved))} GATE 2 (you): approved cases   ${P.approved}`);
  say(`  ${done(existsSync(P.spec))} 3. Tests written              ${P.spec}`);
  say(`  ${done(existsSync(P.report))} 4. Checks and report          ${P.report}`);
}
if (has('status')) { status(); process.exit(0); }

if (!existsSync(P.ac)) fail(`${P.ac} not found. Write the acceptance criteria first (copy the format of docs/ac/cart.md).`);

// ---------------- stage 1: review ----------------
if (!existsSync(P.answers)) {
  if (!existsSync(P.review)) {
    const r = model('Stage 1: AI reviews the acceptance criteria', ['node', 'scripts/ai.mjs', 'review', feature]);
    if (r.code !== 0) fail('The AI review failed. Is the router running? Try: npm run check:llm');
    if (!DRY) mark('1 ai-review', r.seconds);
  }
  say(`\n=== GATE 1: your turn ===`);
  say(`Read the AI's questions in ${P.review}.`);
  say(`Check the answers on the live site yourself, then write ONLY verified facts to ${P.answers}`);
  say(`(see docs/ac/cart.answers.md for the format). Then run:  npm run pipeline -- ${feature}`);
  process.exit(0);
}

// ---------------- stage 2: test cases ----------------
if (has('redo-cases') && existsSync(P.draft)) unlinkSync(P.draft);
if (!existsSync(P.approved)) {
  if (!existsSync(P.draft)) {
    const r = model('Stage 2: AI drafts test cases', ['node', 'scripts/ai.mjs', 'cases', feature]);
    if (r.code !== 0) fail('Drafting test cases failed. Try again, or run: npm run ai:cases -- ' + feature);
    if (DRY) process.exit(0);
    mark('2 ai-test-cases', r.seconds);
  }
  const draft = readFileSync(P.draft, 'utf8');
  if (/WARNING: reply looks cut off/.test(draft)) {
    say(`\nThe drafted table looks cut off. Run:  npm run pipeline -- ${feature} --redo-cases`);
    process.exit(1);
  }
  if (!has('approve')) {
    say(`\n=== GATE 2: your turn ===`);
    say(`Read ${P.draft}. Edit it if needed (concrete expected results, no invented cases, names for every product).`);
    say(`When it is right, approve it and continue:  npm run pipeline -- ${feature} --approve`);
    process.exit(0);
  }
  mkdirSync('docs/test-cases', { recursive: true });
  writeFileSync(P.approved, stripStamp(draft));
  mark('GATE 2 approved by human', 0, P.approved);
  say(`\nApproved: ${P.approved}`);
}

// ---------------- stage 3: tests ----------------
if (!existsSync(P.spec)) {
  if (!existsSync(P.aiSpec) || has('redo-spec')) {
    const r = model('Stage 3: AI writes the tests', ['node', 'scripts/ai.mjs', 'automate', feature]);
    if (r.code !== 0) fail('Writing the tests failed. Try again, or run: npm run ai:automate -- ' + feature);
    if (DRY) process.exit(0);
    mark('3 ai-automate', r.seconds);
  }
  let missing = todos(P.aiSpec);
  if (missing.length) {
    say(`\nThe AI needs page object methods that do not exist yet:`);
    missing.forEach((m) => say(`  ${m.trim()}`));
    const prompt =
      `Load the write-playwright-test skill. The file ${P.aiSpec} has lines marked "// TODO: needs page object method <name>". ` +
      `For each one, add the method to the right page object class in pages/ (product list page = pages/InventoryPage.ts), using getByTestId and the ` +
      `facts in ${P.answers} and ${P.ac}. Do not change existing methods. Then replace each TODO line in ${P.aiSpec} with a call to the new method. ` +
      `Do not edit anything in tests/ or docs/. When done, list the methods you added.`;
    const r = model('Stage 3b: AI adds the missing page object methods', ['opencode', 'run', '--auto', prompt]);
    if (DRY) process.exit(0);
    mark('3b ai-page-objects', r.seconds);
    missing = todos(P.aiSpec);
    if (missing.length) {
      say(`\nStill missing after the AI's attempt. Add these to pages/ yourself, replace the TODO lines in ${P.aiSpec}, and run again:`);
      missing.forEach((m) => say(`  ${m.trim()}`));
      process.exit(1);
    }
  }
  copyFileSync(P.aiSpec, P.spec);
  say(`\nCopied ${P.aiSpec} -> ${P.spec}`);
}

// ---------------- stage 4: checks ----------------
say(`\n--- Stage 4: checks on ${P.spec} ---`);
const rep = { typecheck: '-', tests: '-', review: '-', breaks: [] };
const tc = sh('npm', ['run', '-s', 'typecheck'], { show: false });
rep.typecheck = tc.code === 0 ? 'PASS' : 'FAIL';
say(`Typecheck: ${rep.typecheck}`);
if (tc.code !== 0) say(tc.out.split('\n').slice(0, 12).join('\n'));

if (tc.code === 0) {
  const t = sh('npx', ['playwright', 'test', P.spec, '--reporter=line'], { show: false });
  const passed = Number((t.out.match(/(\d+) passed/) ?? [])[1] ?? 0);
  const failed = Number((t.out.match(/(\d+) failed/) ?? [])[1] ?? 0);
  rep.tests = `${passed} passed, ${failed} failed`;
  say(`Tests: ${rep.tests}`);
  if (/net::ERR_(TIMED_OUT|INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|CONNECTION_(REFUSED|RESET|TIMED_OUT))/.test(t.out)) {
    say(`\nThe site could not be reached (network error). This is NOT a test failure.`);
    say(`Check your internet connection and that https://www.saucedemo.com opens in a browser, then run again:  npm run pipeline -- ${feature}`);
    mark('4 checks aborted', 0, 'site unreachable');
    process.exit(1);
  }
  if (failed) say(t.out.split('\n').slice(-25).join('\n'));
  rep.testsOk = t.code === 0;
}

let rs = null;
if (has('skip-review')) {
  rep.review = 'skipped by you (--skip-review)';
  rep.reviewOut = '';
  rep.reviewerMissing = true;
} else {
  const rv = sh('bash', ['scripts/review.sh', P.spec], { show: false });
  rs = rv.out.match(/Summary \(counted by the script\): (\d+) of (\d+) tests have problems, (\d+) findings/);
  const unavailable = /REVIEWER UNAVAILABLE/.test(rv.out);
  rep.review = rs ? `${rs[1]} of ${rs[2]} tests flagged (${rs[3]} findings)` : unavailable ? 'NOT RUN: free models rate-limited, run npm run review later' : 'reviewer did not finish';
  rep.reviewOut = rv.out;
  rep.reviewerMissing = !rs;
}
say(`Reviewer: ${rep.review}`);

const cf = sh('node', ['scripts/conformance.mjs', P.spec, P.approved], { show: false });
const cs = cf.out.match(/Conformance: (\d+) of (\d+)/);
rep.conformance = cs ? `${cs[1]} of ${cs[2]} approved cases assert their concrete values literally` : 'conformance check did not run';
rep.conformanceOk = cf.code === 0;
rep.conformanceOut = cf.out;
say(`Conformance with the approved cases: ${rep.conformance}`);
if (!rep.conformanceOk) say(cf.out.split('\n').filter((l) => /MISSING/.test(l)).map((l) => '  ' + l.slice(0, 160)).join('\n'));

if (rep.testsOk) {
  const all = ids(P.spec);
  const pick = [...new Set([all[0], all[Math.floor(all.length / 2)], all[all.length - 1]])].filter(Boolean);
  for (const id of pick) {
    const b = sh('bash', ['scripts/break-check.sh', P.spec, id], { show: false });
    const res = (b.out.match(/RESULT: (PASS|FAIL|UNCLEAR)/) ?? [])[1] ?? (b.code === 2 ? 'NOT BREAKABLE' : 'ERROR');
    rep.breaks.push(`${id}: ${res}`);
    say(`Break check ${id}: ${res}${res === 'NOT BREAKABLE' ? ' (no expected text to change; prove it by hand if it matters)' : ''}`);
  }
} else {
  say('Break checks skipped (tests must pass first).');
}

// ---------------- report ----------------
mark('4 checks', 0, `${rep.tests}; reviewer ${rep.review}`);
const ai = state.events.filter((e) => /^(1|2|3|3b) /.test(e.stage)).reduce((s, e) => s + e.seconds, 0);
const gate = state.events.find((e) => e.stage.startsWith('GATE 2'));
const first = state.events[0];
let md = `# Pipeline report: ${feature}\n\nGenerated ${new Date().toISOString()}\n\n`;
md += `| Stage | Result |\n|---|---|\n`;
md += `| Typecheck | ${rep.typecheck} |\n| Tests | ${rep.tests} |\n| Reviewer agent | ${rep.review} |\n| Conformance | ${rep.conformance} |\n`;
rep.breaks.forEach((b) => { md += `| Break check | ${b} |\n`; });
md += `\n## Time\n- AI working time (review, cases, tests): about ${ai} seconds\n`;
if (first) md += `- First stage started: ${first.at}\n`;
if (gate) md += `- Test cases approved by a human at: ${gate.at}\n`;
md += `\n## Human gates\n- Gate 1: ${existsSync(P.answers) ? 'answers written by a human' : 'missing'}\n- Gate 2: ${existsSync(P.approved) ? 'test cases approved by a human' : 'missing'}\n`;
md += `\n## Stages\n${state.events.map((e) => `- ${e.at} ${e.stage}${e.seconds ? ` (${e.seconds}s)` : ''}${e.note ? ` ${e.note}` : ''}`).join('\n')}\n`;
md += `\n## Conformance details\n\`\`\`\n${rep.conformanceOut || ''}\`\`\`\n`;
md += `\n## Reviewer output\n${rep.reviewOut || ''}\n`;
writeFileSync(P.report, md);
say(`\nReport saved: ${P.report}`);
const othersOk = rep.typecheck === 'PASS' && rep.testsOk && rep.conformanceOk && rep.breaks.every((b) => /(PASS|NOT BREAKABLE)$/.test(b)) && rep.breaks.some((b) => /PASS$/.test(b));
if (othersOk && rs && rs[1] === '0') say('\nPIPELINE RESULT: all checks passed. Read the tests once, then commit.');
else if (othersOk && rep.reviewerMissing) say(`\nPIPELINE RESULT: tests, conformance and break checks passed, but the reviewer did not run. Run it later: npm run review -- ${P.spec}  (or accept the risk with --skip-review)`);
else say('\nPIPELINE RESULT: needs your attention. Read the report above.');
