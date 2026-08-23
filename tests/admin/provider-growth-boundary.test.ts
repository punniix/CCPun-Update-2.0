import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ubersuggest = readFileSync(new URL("../../lib/admin/ubersuggest.ts", import.meta.url), "utf8");
const researchRoute = readFileSync(new URL("../../app/api/snt-admin/research/ubersuggest/route.ts", import.meta.url), "utf8");
const growth = readFileSync(new URL("../../lib/admin/growth.ts", import.meta.url), "utf8");
const research = readFileSync(new URL("../../lib/admin/research.ts", import.meta.url), "utf8");
const geoPage = readFileSync(new URL("../../app/snt-admin/(protected)/seo/[id]/page.tsx", import.meta.url), "utf8");
const researchPage = readFileSync(new URL("../../app/snt-admin/(protected)/research/page.tsx", import.meta.url), "utf8");
const researchForm = readFileSync(new URL("../../components/admin/UbersuggestResearchForm.tsx", import.meta.url), "utf8");

test("Ubersuggest credentials stay local and OAuth uses state plus PKCE", () => {
  assert.match(ubersuggest, /\.ccpun-local/);
  assert.match(ubersuggest, /mode: 0o600/);
  assert.match(ubersuggest, /params\.get\("state"\) !== pending\.state/);
  assert.match(ubersuggest, /saveCodeVerifier/);
  assert.match(ubersuggest, /isSafeExternalAuthorizationUrl/);
  assert.match(ubersuggest, /fetch: providerFetch/);
  assert.match(ubersuggest, /redirect: "manual"/);
  assert.match(ubersuggest, /isPublicInternetAddress/);
  assert.match(ubersuggest, /getLocalAdminOrigin\(environment\)/);
  assert.match(ubersuggest, /process\.env\.AUTH_URL\?\.trim\(\) !== origin/);
  assert.doesNotMatch(ubersuggest, /const CALLBACK_URL = "http:\/\/localhost:3000/);
  assert.doesNotMatch(ubersuggest, /console\.(?:log|error)|SANITY.*TOKEN/);
});

test("keyword provider calls stay bounded and expose only stable friendly errors", () => {
  assert.match(ubersuggest, /const KEYWORD_TOOL_TIMEOUT_MS = 45_000/);
  assert.equal((ubersuggest.match(/name: "keyword_overview"/g) ?? []).length, 1);
  assert.equal((ubersuggest.match(/name: "serp_analysis"/g) ?? []).length, 1);
  assert.equal((ubersuggest.match(/timeout: KEYWORD_TOOL_TIMEOUT_MS/g) ?? []).length, 2);
  assert.equal((ubersuggest.match(/maxTotalTimeout: KEYWORD_TOOL_TIMEOUT_MS/g) ?? []).length, 2);
  for (const internalCode of ["UBERSUGGEST_AUTH_REQUIRED", "UBERSUGGEST_TIMEOUT", "UBERSUGGEST_INVALID_RESPONSE", "UBERSUGGEST_TOOL_FAILED"]) {
    assert.match(ubersuggest, new RegExp(internalCode));
  }
  for (const publicCode of ["provider-auth-required", "provider-timeout", "provider-invalid-response", "provider-tool-failed"]) {
    assert.match(researchRoute, new RegExp(publicCode));
    assert.match(researchForm, new RegExp(publicCode));
  }
  assert.doesNotMatch(researchRoute, /error:\s*code/);
  assert.match(researchPage, /ดึงข้อมูลเมื่อ/);
  assert.doesNotMatch(researchPage, />ตรวจเมื่อ</);
});

test("provider retries reuse fresh snapshots and production research uses its own persistence token", () => {
  assert.match(researchRoute, /findFreshResearchSnapshot\("ubersuggest"/);
  assert.match(researchRoute, /const inFlight = new Map/);
  assert.match(researchRoute, /research:provider-query/);
  assert.match(researchRoute, /PROVIDER_RATE_LIMIT/);
  assert.match(researchRoute, /Retry-After/);
  assert.match(research, /keywordKey == \$keywordKey/);
  assert.match(research, /update\(`\$\{parsed\.provider\}\|\$\{keywordKey\}\|\$\{day\}`\)/);
  const credentials = readFileSync(new URL("../../lib/admin/sanity-credentials.ts", import.meta.url), "utf8");
  assert.match(credentials, /environment === "local-production"\s*\? process\.env\.SANITY_PRODUCTION_RESEARCH_WRITE_TOKEN\s*: process\.env\.SANITY_API_WRITE_TOKEN/);
});

test("growth sources fail independently and GEO is explicitly non-ranking", () => {
  assert.match(growth, /Promise\.all\(\[readGscSummary\(\), readGa4Summary\(\), readVercelHealth\(\)\]\)/);
  assert.match(growth, /state: "not-connected"/);
  assert.match(growth, /state: "unavailable"/);
  assert.match(growth, /GA4_TOTALS_MISSING/);
  assert.match(geoPage, /ไม่ใช่คะแนนหรือการรับประกันว่า AI จะอ้างอิง/);
});
