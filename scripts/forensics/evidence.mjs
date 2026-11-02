// Reads Playwright's JSON report and pulls the evidence out of one failed test.
const ANSI = /\u001b\[[0-9;]*m/g;
export const strip = (s = '') => String(s).replace(ANSI, '');

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
export function parseReport(json) { const acc = []; for (const s of json.suites || []) walk(s, s.file, acc); return acc; }
export const isFailed = (t) => t.status === 'unexpected' || t.status === 'flaky' || ['failed', 'timedOut'].includes(t.last.status);
export const testId = (title) => (title.match(/\bTC-[A-Z0-9]+-\d+\b/) || [title.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40)])[0];

export function evidence(t, root = '') {
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
  const loc = err.location;
  return {
    message: message.split('\n').slice(0, 14).join('\n'),
    matcher, expected, received, diff,
    locator: grab(/Locator:\s*(.+)/),
    timeout: grab(/(?:Timeout|Test timeout of)[: ]+(\d+)\s*ms/),
    line: loc ? `${loc.file ? loc.file.replace(root + '/', '') : t.file}:${loc.line}` : (stack.match(/\(?([^\s()]+\.ts:\d+):\d+\)?/) || [])[1] || null,
    snippet: strip(err.snippet || ''),
    screenshot: (attachments.find((a) => a.name === 'screenshot') || {}).path || null,
    trace: (attachments.find((a) => a.name === 'trace') || {}).path || null,
    stderr: strip((r.stderr || []).map((x) => x.text || '').join('')).slice(0, 400),
    durationMs: r.duration || null,
  };
}
