import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import { getSocialProviderReadiness, WEBSITE_42_SOCIAL_PROVIDER_BRANCH } from "../../lib/admin/social/provider-readonly";
import { fetchMetaReadOnlyDiscovery } from "../../lib/admin/social/providers/meta/read-only";
import { fetchTikTokReadOnlyDiscovery, matchTikTokHistoricalAnalytics } from "../../lib/admin/social/providers/tiktok/read-only";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const lane = {
  CCPUN_SOCIAL_PROVIDER_READS_ENABLED: "1",
  CCPUN_APP_ENV: "admin-uat",
  VERCEL_PROJECT_ID: CCPUN_VERCEL_PROJECT_IDS.adminProduction,
  VERCEL_GIT_COMMIT_REF: WEBSITE_42_SOCIAL_PROVIDER_BRANCH,
  NEXT_PUBLIC_SANITY_PROJECT_ID: "ccb9lnw5",
  NEXT_PUBLIC_SANITY_DATASET: "uat",
};

test("Provider readiness requires the exact UAT lane and exact read-only scopes", () => {
  const meta = getSocialProviderReadiness("meta", {
    ...lane,
    CCPUN_META_ACCESS_TOKEN: "not-returned",
    CCPUN_META_GRAPH_VERSION: "v24.0",
    CCPUN_META_GRANTED_SCOPES: "pages_show_list,instagram_basic",
  });
  assert.equal(meta.status, "manual-sync-ready");
  assert.equal(meta.providerWriteAllowed, false);
  assert.equal(meta.backgroundSyncAllowed, false);
  assert.equal(JSON.stringify(meta).includes("not-returned"), false);
  assert.equal(getSocialProviderReadiness("meta", { ...lane, CCPUN_META_ACCESS_TOKEN: "x", CCPUN_META_GRAPH_VERSION: "v24.0", CCPUN_META_GRANTED_SCOPES: "pages_show_list,instagram_basic,pages_manage_posts" }).status, "configuration-required");
  assert.equal(getSocialProviderReadiness("tiktok", { ...lane, CCPUN_TIKTOK_ACCESS_TOKEN: "x", CCPUN_TIKTOK_GRANTED_SCOPES: "user.info.basic,video.list", CCPUN_APP_ENV: "production-admin" }).status, "configuration-required");
});

test("Meta discovery uses bearer auth and returns only sanitized Page and Instagram identity", async () => {
  let url = "";
  let authorization = "";
  const result = await fetchMetaReadOnlyDiscovery({
    ...lane,
    CCPUN_META_ACCESS_TOKEN: "meta-access",
    CCPUN_META_GRAPH_VERSION: "v24.0",
    CCPUN_META_GRANTED_SCOPES: "pages_show_list,instagram_basic",
  }, async (input, init) => {
    url = String(input);
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ data: [
      { id: "page-1", name: "CCPun", instagram_business_account: { id: "ig-1", username: "ccpun" } },
      { id: "page-2", name: "CCPun Two" },
    ] }), { status: 200 });
  });
  assert.match(url, /^https:\/\/graph\.facebook\.com\/v24\.0\/me\/accounts\?/);
  assert.equal(url.includes("meta-access"), false);
  assert.equal(authorization, "Bearer meta-access");
  assert.equal(result.mode, "provider-read-only");
  assert.equal(result.status, "selection-required");
  assert.equal(result.providerRequestAllowed, true);
  assert.equal(result.providerWriteAllowed, false);
  assert.equal(JSON.stringify(result).includes("meta-access"), false);
});

test("TikTok manual read returns recent native metrics and exact-ID matching never persists", async () => {
  const requests: Array<{ url: string; method: string; authorization: string }> = [];
  const result = await fetchTikTokReadOnlyDiscovery({
    ...lane,
    CCPUN_TIKTOK_ACCESS_TOKEN: "tiktok-access",
    CCPUN_TIKTOK_GRANTED_SCOPES: "user.info.basic,video.list",
  }, async (input, init) => {
    const url = String(input);
    requests.push({ url, method: init?.method ?? "GET", authorization: new Headers(init?.headers).get("authorization") ?? "" });
    if (url.includes("/user/info/")) return new Response(JSON.stringify({ data: { user: { open_id: "open-1", display_name: "CCPun" } }, error: { code: "ok" } }));
    return new Response(JSON.stringify({ data: { videos: [
      { id: "video-1", title: "One", create_time: 1788134400, view_count: 100, like_count: 10, comment_count: 2, share_count: 1 },
      { id: "video-2", title: "Two", create_time: 1788048000, view_count: 50, like_count: 5, comment_count: 1, share_count: 0 },
    ], cursor: 1788048000000, has_more: false }, error: { code: "ok" } }));
  });
  assert.deepEqual(requests.map((item) => item.method), ["GET", "POST"]);
  assert.equal(requests.every((item) => item.authorization === "Bearer tiktok-access" && !item.url.includes("tiktok-access")), true);
  assert.equal(result.providerWriteAllowed, false);
  assert.equal(result.backgroundSyncAllowed, false);
  const matched = matchTikTokHistoricalAnalytics([
    { publicationId: "publication-1", platform: "tiktok", platformObjectId: "video-1" },
  ], result);
  assert.deepEqual(matched.snapshots[0]?.nativeMetrics.map((metric) => metric.key), ["tiktok.view_count", "tiktok.like_count", "tiktok.comment_count", "tiktok.share_count"]);
  assert.deepEqual(matched.unmatchedProviderObjectIds, ["video-2"]);
  assert.equal(matched.persisted, false);
});

test("TikTok read rejects timestamps that cannot become valid dates", async () => {
  await assert.rejects(() => fetchTikTokReadOnlyDiscovery({
    ...lane,
    CCPUN_TIKTOK_ACCESS_TOKEN: "tiktok-access",
    CCPUN_TIKTOK_GRANTED_SCOPES: "user.info.basic,video.list",
  }, async (input) => new Response(JSON.stringify(String(input).includes("/user/info/")
    ? { data: { user: { open_id: "open-1", display_name: "CCPun" } }, error: { code: "ok" } }
    : { data: { videos: [{ id: "video-1", create_time: Number.MAX_SAFE_INTEGER }], cursor: 0, has_more: false }, error: { code: "ok" } }
  ))), /TIKTOK_READ_INVALID_RESPONSE/);
});

test("Manual social routes and pages remain human-only, same-origin and provider-write free", () => {
  for (const provider of ["meta", "tiktok"] as const) {
    const route = read(`app/api/snt-admin/social/providers/${provider}/discovery/route.ts`);
    assert.match(route, /identity\.actorType !== "human"/);
    assert.match(route, /hasAdminPermission\(identity\.role, "social:read"\)/);
    assert.match(route, /isSameOriginAdminMutation\(request\.url, request\.headers\.get\("origin"\)\)/);
    assert.match(route, /export async function POST\(request: Request\)/);
    assert.doesNotMatch(route, /export async function (?:PUT|PATCH|DELETE)/);
    assert.doesNotMatch(route, /setInterval|cron|createClient|INSERT|UPDATE|DELETE FROM/);
  }
  const client = read("features/admin/social/provider-readonly-panels.tsx");
  const tiktokPage = read("features/admin/social/tiktok-connection-page.tsx");
  assert.match(client, /Sync Meta แบบอ่านอย่างเดียว/);
  assert.match(client, /Sync TikTok แบบอ่านอย่างเดียว/);
  assert.match(tiktokPage, /video\.upload และ video\.publish ถูกปฏิเสธ/);
  assert.doesNotMatch(client, /accessToken|refreshToken|clientSecret/);
});
