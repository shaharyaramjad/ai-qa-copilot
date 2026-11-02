// Loads every rule in ./rules (sorted by file name) and returns the first verdict that matches.
// To add a rule: drop a new file in ./rules, see CONTRIBUTING.md.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'rules');
export const rules = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
  const m = await import(pathToFileURL(join(dir, f)).href);
  rules.push({ file: f, ...m.default });
}

export function context(ev, rerun, base) {
  return {
    rerun, base,
    text: ev.message + '\n' + ev.stderr,
    hasValues: !!((ev.expected && ev.received) || ev.diff),
    flakyPartial: !!(rerun && rerun.runs > 1 && rerun.passes > 0 && rerun.passes < rerun.runs),
    stillFails: !rerun || rerun.runs < 2 || rerun.passes === 0,
    baseOk: !!(base && base.runs > 0 && base.passes === base.runs),
  };
}

export function judge(ev, rerun, base) {
  const ctx = context(ev, rerun, base);
  for (const rule of rules) {
    const v = rule.match(ev, ctx);
    if (v) return { ...v, rule: rule.id };
  }
  return { verdict: 'UNKNOWN', confidence: 'low', rule: 'fallback', why: 'The failure does not match a known pattern.', next: 'Read the error and open the trace. Consider adding a rule (see CONTRIBUTING.md).' };
}
