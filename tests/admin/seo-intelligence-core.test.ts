import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import { gscQueryInputSchema, normalizeGscSearchAnalyticsPage, previousEqualDateRange } from "../../lib/admin/seo-intelligence/contracts";
import {
  detectSeoOpportunities,
  getSyntheticSeoIntelligenceSnapshot,
  isBrandedQuery,
  isSeoIntelligenceEnabled,
  SYNTHETIC_SEO_OBSERVATIONS,
  WEBSITE_42_SEO_BRANCH,
  WEBSITE_42_SEO_SANITY_DATASET,
  WEBSITE_42_SEO_SANITY_PROJECT_ID,
} from "../../lib/admin/seo-intelligence/foundation";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const enabledInput = {
  flag: "1",
  environment: "admin-uat" as const,
  projectId: CCPUN_VERCEL_PROJECT_IDS.adminProduction,
  gitBranch: WEBSITE_42_SEO_BRANCH,
  sanityProjectId: WEBSITE_42_SEO_SANITY_PROJECT_ID,
  sanityDataset: WEBSITE_42_SEO_SANITY_DATASET,
};

test("SEO Intelligence opens only on the exact Admin UAT branch and data plane", () => {
  assert.equal(isSeoIntelligenceEnabled(enabledInput), true);
  for (const change of [
    { flag: "true" },
    { environment: "production-admin" as const },
    { projectId: CCPUN_VERCEL_PROJECT_IDS.web },
    { gitBranch: "v4-production" },
    { sanityProjectId: "kyfxgjnq" },
    { sanityDataset: "production" },
  ]) assert.equal(isSeoIntelligenceEnabled({ ...enabledInput, ...change }), false, JSON.stringify(change));
});

test("Four deterministic detectors find intended fixtures and suppress known false positives", () => {
  const opportunities = detectSeoOpportunities(SYNTHETIC_SEO_OBSERVATIONS);
  assert.equal(opportunities.length, 4);
  assert.deepEqual(new Set(opportunities.map((item) => item.type)), new Set(["ctr-underperformance", "position-4-15", "content-decay", "cannibalization"]));
  assert.equal(opportunities.filter((item) => item.type === "cannibalization").length, 1);
  assert.equal(opportunities.find((item) => item.type === "cannibalization")?.affectedPages.length, 2);
  for (const suppressedId of ["position-18", "recent-change", "seasonal-tax", "brand"]) {
    assert.equal(opportunities.some((item) => item.id.endsWith(`:${suppressedId}`)), false, suppressedId);
  }
  assert.equal(isBrandedQuery("CC Pun ที่ปรึกษาการเงิน"), true);
  assert.equal(isBrandedQuery("วางแผนเกษียณ"), false);
});

test("Priority is explainable, bounded and synthetic limitations are explicit", () => {
  const snapshot = getSyntheticSeoIntelligenceSnapshot();
  assert.equal(snapshot.mode, "synthetic-uat");
  assert.ok(snapshot.opportunities.length >= 4);
  for (const opportunity of snapshot.opportunities) {
    assert.ok(opportunity.priority >= 0 && opportunity.priority <= 100);
    assert.equal(Object.keys(opportunity.priorityComponents).length, 5);
    assert.ok(opportunity.protectedFields.includes("publish"));
    assert.ok(opportunity.evidence.length >= 3);
  }
  assert.match(snapshot.limitations.join(" "), /ไม่ใช่ตัวเลขของ ccpun\.com/);
});

test("GSC normalization follows requested dimension order and rejects malformed provider rows", () => {
  const rows = normalizeGscSearchAnalyticsPage({ rows: [{
    keys: ["ประกันสุขภาพ", "https://ccpun.com/blog/health-insurance/example/", "MOBILE", "tha"],
    clicks: 12,
    impressions: 600,
    ctr: 0.02,
    position: 7.5,
  }] }, ["query", "page", "device", "country"]);
  assert.deepEqual(rows[0]?.dimensions, {
    query: "ประกันสุขภาพ",
    page: "https://ccpun.com/blog/health-insurance/example/",
    device: "MOBILE",
    country: "tha",
  });
  assert.equal(gscQueryInputSchema.safeParse({ siteUrl: "sc-domain:ccpun.com", token: "fixture", startDate: "2026-08-28", endDate: "2026-08-01", dimensions: ["query"] }).success, false);
  assert.equal(gscQueryInputSchema.safeParse({ siteUrl: "sc-domain:ccpun.com", token: "fixture", startDate: "2026-02-30", endDate: "2026-03-01", dimensions: ["query"] }).success, false);
  assert.deepEqual(previousEqualDateRange("2026-08-01", "2026-08-28"), { startDate: "2026-07-04", endDate: "2026-07-31" });
  assert.throws(() => normalizeGscSearchAnalyticsPage({ rows: [{ keys: ["only-one"], clicks: 1, impressions: 10, ctr: 0.1, position: 2 }] }, ["query", "page"]), /GSC_DIMENSION_MISMATCH/);
});

test("GSC provider is server-only, paginated, bounded and never logs credentials", () => {
  const provider = read("lib/admin/seo-intelligence/providers/gsc.ts");
  assert.match(provider, /import "server-only"/);
  assert.match(provider, /const MAX_PAGES = 2/);
  assert.match(provider, /rowLimit: input\.rowLimit/);
  assert.match(provider, /startRow: page \* input\.rowLimit/);
  assert.match(provider, /AbortSignal\.timeout\(TIMEOUT_MS\)/);
  assert.match(provider, /response\.status === 429/);
  assert.match(provider, /GSC_AUTH_REQUIRED/);
  assert.match(provider, /GSC_TIMEOUT/);
  assert.doesNotMatch(provider, /console\./);
});

test("GSC manual sync is human-only, exact-origin, bounded and read-only", () => {
  const route = read("app/api/snt-admin/seo/opportunities/sync/gsc/route.ts");
  const control = read("features/admin/seo/opportunities/GscManualSync.tsx");
  assert.match(route, /identity\.actorType !== "human"/);
  assert.match(route, /research:provider-query/);
  assert.match(route, /isConfiguredAdminOrigin/);
  assert.match(route, /isSameOriginAdminMutation/);
  assert.match(route, /getSeoIntelligenceRuntimeStatus\(\)\.enabled/);
  assert.match(route, /current\.rows\.slice\(0, 100\)/);
  assert.match(route, /CCPUN_GSC_ACCESS_TOKEN/);
  assert.match(route, /export async function POST\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:GET|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(route, /createClient|sanity|mutate|publish|console\./i);
  assert.match(control, /type="date"/);
  assert.match(control, /กำลัง Sync/);
  assert.match(control, /role="alert"/);
  assert.match(control, /ไม่บันทึก DB\/Sanity/);
});

test("SEO opportunities API is authenticated, exact-origin and GET-only", () => {
  const route = read("app/api/snt-admin/seo/opportunities/route.ts");
  const page = read("app/snt-admin/(protected)/seo/opportunities/page.tsx");
  assert.match(route, /getAdminIdentity\(\)/);
  assert.match(route, /hasAdminPermission\(identity\.role, "seo:read"\)/);
  assert.match(route, /isConfiguredAdminOrigin\(request\.url, process\.env\.AUTH_URL\)/);
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(route, /createClient|fetch\(|publish|mutate/);
  assert.equal(page.trim(), 'export { metadata, default } from "@/features/admin/seo/opportunities/page";');
});
