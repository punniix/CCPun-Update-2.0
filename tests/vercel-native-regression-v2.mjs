import assert from 'node:assert/strict';
import { readFile, unlink, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('./vercel-native-regression.mjs', import.meta.url);
const generatedUrl = new URL('./.vercel-native-regression-v2.generated.mjs', import.meta.url);
let source = await readFile(sourceUrl, 'utf8');

const replacements = [
  [
    "  ['aia-health-happy', 'https://ccpun.com/blog/life-insurance/aia-health-happy-describe/'],",
    "  ['aia-health-happy', 'https://ccpun.com/blog/health-insurance/aia-health-happy-describe/'],",
  ],
  [
    "  ['aia-health-ci-hero', 'https://ccpun.com/blog/life-insurance/aia-health-ci-hero-guide/'],",
    "  ['aia-health-ci-hero', 'https://ccpun.com/blog/health-insurance/aia-health-ci-hero-guide/'],",
  ],
  [
    "  ['critical-illness-insurance', 'https://ccpun.com/blog/life-insurance/critical-illness-insurance/'],",
    "  ['critical-illness-insurance', 'https://ccpun.com/blog/critical-illness/critical-illness-insurance/'],",
  ],
  [
    "  ['life-insurance', 'ประกันชีวิต'],\n  ['investment', 'การลงทุน'],",
    "  ['life-insurance', 'ประกันชีวิต'],\n  ['health-insurance', 'ประกันสุขภาพ'],\n  ['critical-illness', 'ประกันโรคร้ายแรง'],\n  ['investment', 'การลงทุน'],",
  ],
  [
    "assert.match(legacyArticles, /id: \"legacy-wp-aia-health-happy-describe\"[\\s\\S]*?categorySlug: \"life-insurance\"/);",
    "assert.match(legacyArticles, /id: \"legacy-wp-aia-health-happy-describe\"[\\s\\S]*?categorySlug: \"health-insurance\"/);",
  ],
  [
    "assert.match(legacyArticles, /id: \"legacy-wp-aia-health-ci-hero-guide\"[\\s\\S]*?categorySlug: \"life-insurance\"/);",
    "assert.match(legacyArticles, /id: \"legacy-wp-aia-health-ci-hero-guide\"[\\s\\S]*?categorySlug: \"health-insurance\"/);",
  ],
  [
    "assert.match(legacyArticles, /id: \"legacy-wp-critical-illness-insurance\"[\\s\\S]*?categorySlug: \"life-insurance\"/);",
    "assert.match(legacyArticles, /id: \"legacy-wp-critical-illness-insurance\"[\\s\\S]*?categorySlug: \"critical-illness\"/);",
  ],
];

for (const [before, after] of replacements) {
  assert.equal(source.includes(before), true, `V2 compatibility source marker missing: ${before.slice(0, 80)}`);
  source = source.replace(before, after);
}

// The published WordPress preparer is a historical migration artifact. It must
// continue to fail closed for categories that were not part of its original
// category-ID map rather than being silently repurposed for a new Production
// taxonomy. Active Draft imports and the V2 migration have their own contracts.

try {
  await writeFile(generatedUrl, source, { encoding: 'utf8', flag: 'w' });
  await import(`${generatedUrl.href}?run=${Date.now()}`);
} finally {
  await unlink(generatedUrl).catch(() => undefined);
}
