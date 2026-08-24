import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const script = read('scripts/analytics/archive-performance-to-sheets.mjs');
const workflow = read('.github/workflows/archive-performance.yml');

for (const requiredSheet of ['GA4 Archive', 'GSC Archive', 'Meta Archive']) assert.match(script, new RegExp(requiredSheet));
assert.match(script, /SKIPPED_DUPLICATE/);
assert.match(script, /analytics\.readonly/);
assert.match(script, /webmasters\.readonly/);
assert.match(script, /line_oa_click/);
assert.match(script, /dataState:\s*'final'/);
assert.match(script, /sc-domain:ccpun\.com/);
assert.match(workflow, /3 days ago/);
assert.match(workflow, /1 day ago/);
assert.doesNotMatch(script, /email|phone|telephone|income|expense|health condition|calculator value/i, 'Archive must not request customer PII or calculator values');
assert.doesNotMatch(workflow, /vercel/i, 'Performance archive must remain hosting-independent');

console.log('PASS: analytics archive regression');
