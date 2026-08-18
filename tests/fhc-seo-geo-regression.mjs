import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/tools/financial-health-check/page.tsx', import.meta.url), 'utf8');
const intro = readFileSync(new URL('../components/FinancialHealthCheck/FHCLandingIntro.tsx', import.meta.url), 'utf8');

assert.match(intro, /export const FHC_FAQS = \[/, 'Visible FHC FAQ content must stay defined in the intro');
assert.match(intro, /FHC_FAQS\.map\(/, 'Visible FHC FAQs must render from the schema source');
assert.match(page, /import \{ FHC_FAQS \}/, 'FHC schema must use the visible FAQ source');
assert.match(page, /'@type': 'FAQPage'/, 'FHC must expose FAQPage only from visible FAQ content');
assert.match(page, /mainEntity: FHC_FAQS\.map\(/, 'FHC FAQ schema answers must match visible answers');
assert.match(page, /canonical: 'https:\/\/ccpun\.com\/tools\/financial-health-check\/'/, 'FHC canonical must remain self-referencing');

console.log('PASS FHC SEO/GEO answerability regression');
