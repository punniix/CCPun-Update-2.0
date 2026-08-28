import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import {
  buildSyntheticContentCalendar,
  buildSyntheticPublicationPlans,
  isSocialOperationsEnabled,
  planCommentSeries,
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
    "prepare-native-handoff",
  ]);
});

test("Social analytics preserves native metrics and never creates a cross-platform total", () => {
  const snapshot = socialOperationsSnapshotSchema.parse(SYNTHETIC_SOCIAL_OPERATIONS);
  assert.equal(snapshot.analytics.length, 5);
  assert.equal(snapshot.publications.every((item) => item.status === "published" && item.publishedAt && item.platformObjectId && item.providerWriteAllowed === false), true);
  assert.equal(snapshot.analytics.every((item) => item.source === "synthetic-uat"), true);
  assert.equal(snapshot.analytics.flatMap((item) => item.nativeMetrics).every((metric) => metric.key.includes(".")), true);
  for (const metric of snapshot.analytics) {
    const publication = snapshot.publications.find((item) => item.publicationId === metric.publicationId);
    assert.equal(publication?.platform, metric.platform);
    assert.ok(publication?.publishedAt && Date.parse(metric.fetchedAt) >= Date.parse(publication.publishedAt));
  }
  assert.equal(Object.hasOwn(snapshot, "totalViews"), false);
  const live = snapshot.analytics.find((item) => item.publicationId === "uat-published:synthetic-youtube-live-001");
  assert.deepEqual(live?.nativeMetrics.map((metric) => metric.key), [
    "youtube.averageConcurrentViewers",
    "youtube.peakConcurrentViewers",
    "youtube.estimatedMinutesWatched",
  ]);
  assert.match(live?.limitations[0] ?? "", /หลังจบ Live/);
  assert.equal(JSON.stringify(snapshot).includes("expectedUplift"), false);

  const invalid = structuredClone(SYNTHETIC_SOCIAL_OPERATIONS);
  invalid.publications[0]!.status = "approved";
  invalid.publications[0]!.publishedAt = null;
  invalid.publications[0]!.platformObjectId = null;
  assert.equal(socialOperationsSnapshotSchema.safeParse(invalid).success, false);
});

test("Content Calendar derives one read-only item per variant without provider execution", () => {
  const items = buildSyntheticContentCalendar();
  assert.equal(items.length, 5);
  assert.deepEqual(items.map((item) => item.status), ["approved", "awaiting-native-finish", "draft", "approved", "approved"]);
  assert.equal(items.every((item) => item.masterContentId === "synthetic-master-001" && item.providerWriteAllowed === false), true);
  assert.equal(items.every((item) => typeof item.analyticsAvailable === "boolean"), true);
  const page = read("features/admin/social/calendar-page.tsx");
  const route = read("app/snt-admin/(protected)/distribution/calendar/page.tsx");
  assert.match(page, /requireAdminPermission\("social:read"\)/);
  assert.match(page, /getSocialOperationsRuntimeStatus\(\)\.enabled/);
  assert.match(page, /ไม่มีคำสั่งส่งโพสต์/);
  assert.equal(route.trim(), 'export { metadata, default } from "@/features/admin/social/calendar-page";');
});

test("Comment Series waits for the main post and rejects unsafe thread graphs", () => {
  const base = {
    publicationId: "publication:facebook:001",
    platform: "facebook" as const,
    mainPostStatus: "published" as const,
    mainPostId: "facebook-post-001",
    mode: "threaded" as const,
    comments: [
      { id: "comment-1", order: 1, parentItemId: null, status: "published" as const, platformCommentId: "facebook-comment-1" },
      { id: "comment-2", order: 2, parentItemId: "comment-1", status: "approved" as const, platformCommentId: null },
    ],
  };
  assert.deepEqual(planCommentSeries(base), {
    publicationId: base.publicationId,
    state: "ready",
    nextCommentId: "comment-2",
    providerWriteAllowed: false,
    reason: "พร้อมสำหรับ executor ที่ผ่านการอนุมัติ แต่ UAT นี้ยังไม่เรียก Provider",
  });
  assert.equal(planCommentSeries({ ...base, mainPostStatus: "approved", mainPostId: null }).state, "wait-main-post");
  assert.equal(planCommentSeries({ ...base, comments: [{ ...base.comments[0]!, status: "draft", platformCommentId: null }] }).state, "wait-approval");
  assert.equal(planCommentSeries({ ...base, comments: base.comments.map((item, index) => ({ ...item, parentItemId: index ? "comment-2" : "comment-2" })) }).state, "invalid");
  assert.equal(planCommentSeries({ ...base, mode: "top-level", comments: base.comments }).state, "invalid");
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
