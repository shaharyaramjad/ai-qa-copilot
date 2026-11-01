#!/usr/bin/env node
// Checks that a spec really contains the concrete values from the APPROVED test cases
// (quoted names/texts and $ prices in the "Expected result" column). A test that computes its
// expectation from the app's own output can pass while the app is wrong; this catches that.
// Usage: node scripts/conformance.mjs <spec file> <approved test cases .md>
import { readFileSync } from 'node:fs';

const [, , specPath, casesPath] = process.argv;
if (!specPath || !casesPath) { console.error('usage: conformance.mjs <spec> <approved cases>'); process.exit(2); }
const spec = readFileSync(specPath, 'utf8');
const cases = readFileSync(casesPath, 'utf8');

// split the spec into one chunk per test
const chunks = spec.split(/\n\s*test(?:\.skip)?\(/).slice(1);
const chunkFor = (id) => chunks.find((c) => c.trimStart().startsWith(`'${id}`) || c.trimStart().startsWith(`"${id}`) || c.trimStart().startsWith('`' + id));

let checked = 0, bad = 0, noValues = 0;
for (const line of cases.split('\n')) {
  if (!line.startsWith('|')) continue;
  const cells = line.split('|').map((c) => c.trim());
  const id = cells[1];
  if (!/^TC-[A-Z]+-\d+$/.test(id)) continue;
  const expected = cells[4] ?? '';
  const values = [
    ...[...expected.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    ...[...expected.matchAll(/\$\d+(?:\.\d{2})?/g)].map((m) => m[0]),
  ];
  const unique = [...new Set(values)];
  const chunk = chunkFor(id);
  if (!chunk) { console.log(`${id}: MISSING - no test with this ID in ${specPath}`); bad++; checked++; continue; }
  if (!unique.length) { console.log(`${id}: n/a (no concrete values in the expected result)`); noValues++; continue; }
  const missing = unique.filter((v) => !chunk.includes(v) && !chunk.includes(v.replace(/^\$/, '')));
  checked++;
  if (missing.length) { bad++; console.log(`${id}: MISSING ${missing.length} of ${unique.length} values from the approved case: ${missing.map((m) => JSON.stringify(m)).join(', ')}`); }
  else console.log(`${id}: ok (${unique.length} values found)`);
}
console.log(`Conformance: ${checked - bad} of ${checked} approved cases with concrete values are asserted literally (${noValues} have none).`);
process.exit(bad ? 1 : 0);
