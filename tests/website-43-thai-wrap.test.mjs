import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../features/website-43-uat/Website43Home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../features/website-43-uat/Website43.module.css', import.meta.url), 'utf8');

assert.match(home, /มัน<span className=\{styles\.homeHeroWord\}>ซับซ้อน<\/span>/);
assert.doesNotMatch(home, /มัน\s*<br\s*\/?>\s*ซับซ้อน/);
assert.match(css, /\.homeHeroTitle \.homeHeroWord \{ white-space: nowrap; \}/);

console.log('PASS: Hero keeps the complete Thai word ซับซ้อน together without a forced line break');
