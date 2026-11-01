// Turns a Playwright JSON report into an evidence file for the flaky hunter agent.
// Usage: node scripts/flaky-report.mjs <report.json> <test id> <spec file> <runs> <workers>
import fs from 'node:fs';

const [, , jsonPath, id, spec, runs = '?', workers = '?'] = process.argv;
if (!jsonPath || !id) { console.error('usage: flaky-report.mjs <report.json> <test id> <spec> <runs> <workers>'); process.exit(1); }
if (!fs.existsSync(jsonPath)) { console.error(`No report at ${jsonPath}. Did Playwright start? Run the spec once by hand first.`); process.exit(1); }

const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const results = [];
(function walk(suites) {
  for (const s of suites ?? []) {
    for (const sp of s.specs ?? []) {
      if (!sp.title.includes(id)) continue;
      for (const t of sp.tests ?? []) {
        for (const r of t.results ?? []) {
          results.push({
            status: r.status,
            ms: r.duration,
            error: (r.error?.message ?? '').replace(/\x1b\[[0-9;]*m/g, ''),
            out: (r.stdout ?? []).map((o) => o.text ?? '').join('').trim(),
          });
        }
      }
    }
    walk(s.suites);
  }
})(report.suites);

if (!results.length) { console.error(`No test with "${id}" in its title was found in ${spec}.`); process.exit(1); }

const passed = results.filter((r) => r.status === 'passed');
const failed = results.filter((r) => r.status !== 'passed');
const verdict = !failed.length ? 'ALL PASSED' : !passed.length ? 'ALWAYS FAILED' : 'MIXED (flaky)';
const stats = (arr) => {
  if (!arr.length) return 'n/a';
  const ms = arr.map((r) => r.ms).sort((a, b) => a - b);
  return `min ${ms[0]} ms, median ${ms[Math.floor(ms.length / 2)]} ms, max ${ms[ms.length - 1]} ms`;
};

const groups = new Map();
for (const r of failed) {
  const key = r.error.split('\n').filter(Boolean).slice(0, 6).join('\n');
  groups.set(key, (groups.get(key) ?? 0) + 1);
}

let md = `# Flaky evidence: ${id}\n\n`;
md += `- Spec: ${spec}\n- Runs: ${results.length} (asked for ${runs}), workers: ${workers}\n`;
md += `- Passed: ${passed.length}, failed: ${failed.length}\n- Counted result: ${verdict}\n`;
md += `- Passed durations: ${stats(passed)}\n- Failed durations: ${stats(failed)}\n\n`;
md += `## Failure messages (grouped)\n`;
if (!groups.size) md += 'None.\n';
for (const [msg, n] of groups) md += `\n${n}x\n\`\`\`\n${msg}\n\`\`\`\n`;
md += `\n## Every run\n| Run | Status | Duration ms | Test output (console.log) |\n|---|---|---|---|\n`;
results.forEach((r, i) => { md += `| ${i + 1} | ${r.status} | ${r.ms} | ${r.out.replace(/\n/g, ' ; ') || '-'} |\n`; });

fs.mkdirSync('ai-output', { recursive: true });
const out = `ai-output/flaky-${id}.md`;
fs.writeFileSync(out, md);
console.log(`${id}: ${passed.length} of ${results.length} passed -> ${verdict}`);
console.log(`Passed: ${stats(passed)} | Failed: ${stats(failed)}`);
console.log(`Evidence saved: ${out}`);
