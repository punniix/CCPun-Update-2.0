import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
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
