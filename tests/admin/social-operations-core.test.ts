import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import {
  buildSyntheticPublicationPlans,
  isSocialOperationsEnabled,
  socialOperationsSnapshotSchema,
  SYNTHETIC_SOCIAL_OPERATIONS,
  WEBSITE_42_SOCIAL_OPERATIONS_BRANCH,
} from "../../lib/admin/social/operations";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const enabledInput = {
  flag: "1",
  dataMode: "synthetic",
  environment: "admin-uat" as const,
  projectId: CCPUN_VERCEL_PROJECT_IDS.adminProduction,
  gitBranch: WEBSITE_42_SOCIAL_OPERATIONS_BRANCH,
  sanityProjectId: "ccb9lnw5",
  sanityDataset: "uat",
};

test("Social operations requires the exact Admin UAT lane", () => {
  assert.equal(isSocialOperationsEnabled(enabledInput), true);
  for (const change of [
    { flag: "0" },
    { dataMode: "live" },
    { environment: "production-admin" as const },
    { projectId: CCPUN_VERCEL_PROJECT_IDS.web },
    { gitBranch: "v4-production" },
    { sanityProjectId: "kyfxgjnq" },
    { sanityDataset: "production" },
  ]) assert.equal(isSocialOperationsEnabled({ ...enabledInput, ...change }), false);
});

test("Publication planning is deterministic and cannot write to a provider", () => {
  const first = buildSyntheticPublicationPlans();
  const second = buildSyntheticPublicationPlans();
  assert.deepEqual(first, second);
  assert.equal(first.every((plan) => plan.providerWriteAllowed === false), true);
  assert.deepEqual(first.map((plan) => plan.nextAction), [
    "prepare-native-handoff",
    "wait-human-finish",
    "wait-human-review",
    "prepare-native-handoff",
  ]);
});

test("Social analytics preserves native metrics and never creates a cross-platform total", () => {
  const snapshot = socialOperationsSnapshotSchema.parse(SYNTHETIC_SOCIAL_OPERATIONS);
  assert.equal(snapshot.analytics.length, 4);
  assert.equal(snapshot.analytics.every((item) => item.source === "synthetic-uat"), true);
  assert.equal(snapshot.analytics.flatMap((item) => item.nativeMetrics).every((metric) => metric.key.includes(".")), true);
  assert.equal(Object.hasOwn(snapshot, "totalViews"), false);
  assert.equal(JSON.stringify(snapshot).includes("expectedUplift"), false);
});

test("Social operations API is authenticated, exact-origin and GET-only", () => {
  const route = read("app/api/snt-admin/social/operations/route.ts");
  const page = read("app/snt-admin/(protected)/distribution/operations/page.tsx");
  const layout = read("app/snt-admin/(protected)/layout.tsx");
  const distribution = read("features/admin/social/page.tsx");
  assert.match(route, /getAdminIdentity\(\)/);
  assert.match(route, /hasAdminPermission\(identity\.role, "social:read"\)/);
  assert.match(route, /isConfiguredAdminOrigin\(request\.url, process\.env\.AUTH_URL\)/);
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(route, /fetch\(|\b(?:INSERT|UPDATE|DELETE|POST|PATCH|PUT)\b/i);
  assert.equal(page.trim(), 'export { metadata, default } from "@/features/admin/social/operations-page";');
  assert.match(layout, /getSocialFoundationRuntimeStatus\(\)\.enabled \|\| getSocialOperationsRuntimeStatus\(\)\.enabled/);
  assert.match(layout, /item\.href !== "\/snt-admin\/distribution\/" \|\| socialEnabled/);
  assert.match(distribution, /redirect\("\/snt-admin\/distribution\/operations\/"\)/);
});
