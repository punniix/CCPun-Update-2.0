import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SYNTHETIC_SOCIAL_FOUNDATION } from "../../lib/admin/social/foundation";
import { SYNTHETIC_PUBLISHED_SOCIAL_RECORDS } from "../../lib/admin/social/operations";
import {
  postLiveSnapshotSchema,
  SYNTHETIC_POST_LIVE_REPORT,
} from "../../lib/admin/social/post-live";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("Post-Live fixture links a completed Live to publication and Master Content", () => {
  const snapshot = SYNTHETIC_POST_LIVE_REPORT.snapshots[0]!;
  const variant = SYNTHETIC_SOCIAL_FOUNDATION.variants.find((item) => item.id === snapshot.variantId);
  const publication = SYNTHETIC_PUBLISHED_SOCIAL_RECORDS.find((item) => item.publicationId === snapshot.publicationId);
  assert.equal(variant?.format, "live");
  assert.equal(variant?.masterContentId, snapshot.masterContentId);
  assert.equal(publication?.variantId, snapshot.variantId);
  assert.equal(snapshot.collectionMode, "manual-post-live");
  assert.equal(snapshot.realtimePollingAllowed, false);
  assert.equal(snapshot.providerRequestAllowed, false);
  assert.notDeepEqual(snapshot.nativeMetrics, snapshot.normalizedMetrics);
});

test("Provider-neutral contract exposes unavailable and unsupported states without fake metrics", () => {
  const base = SYNTHETIC_POST_LIVE_REPORT.snapshots[0]!;
  for (const providerState of ["unavailable", "unsupported"] as const) {
    const result = postLiveSnapshotSchema.parse({ ...base, snapshotId: `post-live-${providerState}`, providerState, nativeMetrics: [], normalizedMetrics: [] });
    assert.equal(result.providerState, providerState);
    assert.equal(result.nativeMetrics.length, 0);
  }
  assert.equal(postLiveSnapshotSchema.safeParse({ ...base, providerState: "available", nativeMetrics: [], normalizedMetrics: [] }).success, false);
  assert.equal(postLiveSnapshotSchema.safeParse({ ...base, providerState: "unavailable", normalizedMetrics: [] }).success, false);
  assert.equal(postLiveSnapshotSchema.safeParse({ ...base, fetchedAt: "2026-08-28T08:00:00.000Z" }).success, false);
});

test("Post-Live preview route is authenticated, exact-origin and GET-only", () => {
  const route = read("app/api/snt-admin/social/analytics/post-live/route.ts");
  const page = read("features/admin/social/post-live-page.tsx");
  const entry = read("app/snt-admin/(protected)/distribution/analytics/post-live/page.tsx");
  const operations = read("features/admin/social/operations-page.tsx");
  assert.match(route, /getAdminIdentity\(\)/);
  assert.match(route, /hasAdminPermission\(identity\.role, "social:read"\)/);
  assert.match(route, /isConfiguredAdminOrigin\(request\.url, process\.env\.AUTH_URL\)/);
  assert.match(route, /getSocialOperationsRuntimeStatus\(\)\.enabled/);
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(route, /fetch\(|setInterval|cron|createClient/);
  assert.match(page, /requireAdminPermission\("social:read"\)/);
  assert.match(page, /Real-time polling, background sync/);
  assert.equal(entry.trim(), 'export { metadata, default } from "@/features/admin/social/post-live-page";');
  assert.match(operations, /distribution\/analytics\/post-live/);
});
