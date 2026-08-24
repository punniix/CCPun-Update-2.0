import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

function expect(name, pass, detail = '') {
  if (pass) {
    console.log(`PASS ${name}`);
    return;
  }
  failures.push(name);
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

const agents = read('AGENTS.md');
expect('agent workflow protects v4-production', agents.includes('Never edit `v4-production` directly'));
expect('agent workflow requires Preview and human review', agents.includes('Vercel Preview -> human review -> merge'));
expect('agent policy separates canonical URL from semantic topic', agents.includes('Semantic topic classification is a separate knowledge-graph layer'));
expect('agent policy preserves Health CI Hero semantics', agents.includes('AIA Health CI Hero is health/medical-expense insurance') && agents.includes('It is NOT critical-illness lump-sum insurance'));
expect('agent policy protects analytics consent', agents.includes('Consent must remain authoritative'));

const urlContract = read('lib/content/url.ts');
const frozenMovedPaths = [
  ['health-insurance/aia-health-happy-describe', '/blog/life-insurance/aia-health-happy-describe/'],
  ['health-insurance/aia-health-ci-hero-guide', '/blog/life-insurance/aia-health-ci-hero-guide/'],
  ['critical-illness/critical-illness-insurance', '/blog/life-insurance/critical-illness-insurance/'],
];
for (const [source, destination] of frozenMovedPaths) {
  expect(`frozen URL contract ${source}`, urlContract.includes(`"${source}": "${destination}"`), destination);
}
expect('canonical alignment remains ccpun.com only', urlContract.includes('canonical.origin === "https://ccpun.com"'));

const ledger = JSON.parse(read('qa/legacy-url-ledger.json'));
expect('legacy URL ledger remains frozen', typeof ledger.frozenAt === 'string' && ledger.frozenAt.length > 0);
const ledgerText = JSON.stringify(ledger);
for (const [, destination] of frozenMovedPaths.slice(0, 2)) {
  expect(`legacy ledger retains winner destination ${destination}`, ledgerText.includes(`https://ccpun.com${destination}`));
}

const studioPolicy = read('cms/sanity/studio-policy.ts');
expect('non-production Studio blocks publish', /BLOCKED_NON_PRODUCTION_ACTIONS[^\n]*"publish"/.test(studioPolicy));
expect('production admin blocks destructive unpublish/delete', /BLOCKED_PRODUCTION_ADMIN_ACTIONS[^\n]*"delete"[^\n]*"unpublish"/.test(studioPolicy));
expect('disallowed Sanity data plane returns no actions', studioPolicy.includes('if (!isStudioDataPlaneAllowed(dataset, environment, undefined, undefined, projectId)) return [];'));

const analytics = read('lib/analytics.ts');
expect('analytics remains consent-gated', analytics.includes("import { getConsentData } from './cookie-consent';") && analytics.includes('if (!consent) return;'));
expect('analytics keeps allowlisted parameter sanitizer', analytics.includes('export function sanitizeEventParams'));
expect('analytics keeps semantic dataLayer cutover layer', analytics.includes('export function buildSemanticDataLayerEvent') && analytics.includes("event: 'ccpun_event'"));
expect('analytics keeps central trackEvent dispatcher', analytics.includes('export function trackEvent(eventName: string'));

const allowedStringsMatch = analytics.match(/const ALLOWED_STRINGS:[\s\S]*?\n};/);
const allowlist = allowedStringsMatch?.[0] ?? '';
for (const forbidden of ['email', 'phone', 'income', 'expense', 'health_condition', 'name:']) {
  expect(`analytics allowlist excludes ${forbidden}`, !allowlist.toLowerCase().includes(forbidden));
}

const migrationContract = read('cms/sanity/migration-contract.md');
expect('content migration remains draft-first', migrationContract.includes('A content import is not publication'));
expect('published migration requires coordinated URL release', migrationContract.includes('redirect + new canonical + sitemap/internal-link ownership together'));

if (failures.length) {
  console.error(`\nFoundation safety regression failed (${failures.length}):`);
  failures.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

console.log('\nFoundation safety contracts passed.');
