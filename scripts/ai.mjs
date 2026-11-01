#!/usr/bin/env node
// Sends a prompt template plus project files to the free-model router and saves the reply
// in ai-output/ for HUMAN REVIEW. Nothing here edits tests/ or docs/ automatically.
//
// Usage:  npm run ai:review   -- <feature> [runs]
//         npm run ai:cases    -- <feature> [runs]
//         npm run ai:automate -- <feature> [runs]
// Example: npm run ai:review -- cart 3
// Set DRY=1 to only build the prompt and show its size (no model call).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const exists = (p) => existsSync(join(root, p));
const fail = (msg) => { console.error(`Error: ${msg}`); process.exit(1); };

// ---- load .env without dependencies ----
if (exists('.env')) {
  for (const line of read('.env').split('\n')) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const MODES = {
  review:   { prompt: 'prompts/01-ac-review.md',  maxTokens: 700,  out: (f, s) => `ai-output/${f}-ac-review${s}.md` },
  cases:    { prompt: 'prompts/02-test-cases.md', maxTokens: 2000, out: (f, s) => `ai-output/${f}-test-cases${s}.md` },
  automate: { prompt: 'prompts/03-automate.md',   maxTokens: 3000, out: (f, s) => `ai-output/${f}${s}.spec.ts` },
};

const [mode, feature, runsArg] = process.argv.slice(2);
const cfg = MODES[mode];
if (!cfg || !feature) fail('Usage: npm run ai:<review|cases|automate> -- <feature> [runs]   e.g. npm run ai:review -- cart 3');
if (!exists(`docs/ac/${feature}.md`)) fail(`docs/ac/${feature}.md not found`);
const runs = Math.max(1, Number(runsArg) || 1);

// ---- build the prompt ----
const pageObjects = readdirSync(join(root, 'pages')).filter((f) => f.endsWith('.ts'))
  .map((f) => `// pages/${f}\n${read('pages/' + f)}`).join('\n');
const vars = {
  AC: read(`docs/ac/${feature}.md`),
  ANSWERS: exists(`docs/ac/${feature}.answers.md`) ? read(`docs/ac/${feature}.answers.md`) : '(none: use only the acceptance criteria)',
  TEST_CASES: exists(`docs/test-cases/${feature}.md`) ? read(`docs/test-cases/${feature}.md`) : '(missing)',
  CONVENTIONS: read('AGENTS.md'),
  PAGE_OBJECTS: pageObjects,
  EXAMPLE_SPEC: read('tests/login.spec.ts'),
};
const prompt = read(cfg.prompt).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
const unfilled = prompt.match(/\{\{\w+\}\}/g);

if (process.env.DRY) {
  console.log(`DRY RUN ok: mode=${mode} feature=${feature} prompt=${prompt.length} chars (about ${Math.round(prompt.length / 4)} tokens)`);
  console.log(`Unfilled placeholders: ${unfilled ? unfilled.join(', ') : 'none'}`);
  console.log(`Max output tokens: ${process.env.LLM_MAX_TOKENS || cfg.maxTokens}`);
  console.log('--- first lines of prompt ---');
  console.log(prompt.split('\n').slice(0, 8).join('\n'));
  process.exit(0);
}

const SYSTEM = 'You are a careful QA assistant. Follow the requested format exactly. Do not invent facts about the app. If something is unknown, say so.';

async function ask(maxTokens) {
  const base = process.env.LLM_BASE_URL, key = process.env.LLM_API_KEY;
  if (!base || !key) fail('Set LLM_BASE_URL and LLM_API_KEY in .env (see docs/setup/free-models.md)');
  const body = {
    model: process.env.LLM_MODEL || 'auto',
    temperature: 0.2, // low = focused and repeatable
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
  };
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      const data = JSON.parse(text);
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty reply from the model');
      const via = res.headers.get('x-routed-via') || `${data._routed_via?.platform}/${data._routed_via?.model}`;
      return { content, via, finish: data.choices?.[0]?.finish_reason };
    } catch (e) {
      lastErr = e;
      console.error(`Attempt ${attempt}/3 failed: ${e.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    } finally {
      clearTimeout(timer);
    }
  }
  fail(`All attempts failed. Last error: ${lastErr?.message}`);
}

mkdirSync(join(root, 'ai-output'), { recursive: true });
for (let i = 1; i <= runs; i++) {
  const suffix = runs > 1 ? `-run${i}` : '';
  console.log(`\n=== ${mode} ${feature}${runs > 1 ? ` (run ${i}/${runs})` : ''} ===`);
  let limit = Number(process.env.LLM_MAX_TOKENS) || cfg.maxTokens;
  let { content, via, finish } = await ask(limit);
  while (finish === 'length' && limit < 8000) {
    limit = Math.min(limit * 2, 8000);
    console.error(`Reply was cut off (token limit). Retrying with max_tokens=${limit} ...`);
    ({ content, via, finish } = await ask(limit));
  }
  const incomplete = finish === 'length' || (mode === 'cases' && !/\|\s*$/.test(content.trim()));
  if (incomplete) console.error('WARNING: the reply looks cut off. Run the command again or raise LLM_MAX_TOKENS in .env.');
  const stamp = `generated by ${via} on ${new Date().toISOString()}${incomplete ? ' | WARNING: reply looks cut off, do not use as is' : ''}`;
  const outPath = cfg.out(feature, suffix);
  if (mode === 'automate') {
    const block = content.match(/```(?:ts|typescript)?\n([\s\S]*?)```/);
    const code = block ? block[1] : content;
    writeFileSync(join(root, outPath), `// ${stamp}. REVIEW BEFORE USE: run it, then break the app to confirm it can fail.\n${code}`);
    console.log(`Routed via: ${via}\nSaved: ${outPath}${block ? '' : '  (no code block found, saved raw reply)'}`);
  } else {
    writeFileSync(join(root, outPath), `<!-- ${stamp}. Draft for human review. -->\n\n${content}\n`);
    console.log(`Routed via: ${via}\n\n${content}\n\nSaved: ${outPath}`);
  }
}
