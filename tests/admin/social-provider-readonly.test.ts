import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import { getSocialProviderReadiness, WEBSITE_42_SOCIAL_PROVIDER_BRANCH } from "../../lib/admin/social/provider-readonly";
import { fetchMetaReadOnlyDiscovery, matchMetaHistoricalAnalytics } from "../../lib/admin/social/providers/meta/read-only";
import { fetchTikTokReadOnlyDiscovery, matchTikTokHistoricalAnalytics } from "../../lib/admin/social/providers/tiktok/read-only";
import { fetchYouTubeReadOnlyDiscovery, matchYouTubeHistoricalAnalytics } from "../../lib/admin/social/providers/youtube/read-only";

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
    CCPUN_META_GRANTED_SCOPES: "pages_show_list,pages_read_engagement,instagram_basic",
  });
  assert.equal(meta.status, "manual-sync-ready");
  assert.equal(meta.providerWriteAllowed, false);
  assert.equal(meta.backgroundSyncAllowed, false);
  assert.equal(JSON.stringify(meta).includes("not-returned"), false);
  assert.equal(getSocialProviderReadiness("meta", { ...lane, CCPUN_META_ACCESS_TOKEN: "x", CCPUN_META_GRAPH_VERSION: "v24.0", CCPUN_META_GRANTED_SCOPES: "pages_show_list,pages_read_engagement,instagram_basic,pages_manage_posts" }).status, "configuration-required");
  assert.equal(getSocialProviderReadiness("youtube", { ...lane, CCPUN_YOUTUBE_ACCESS_TOKEN: "x", CCPUN_YOUTUBE_GRANTED_SCOPES: "https://www.googleapis.com/auth/youtube.readonly" }).status, "manual-sync-ready");
  assert.equal(getSocialProviderReadiness("tiktok", { ...lane, CCPUN_TIKTOK_ACCESS_TOKEN: "x", CCPUN_TIKTOK_GRANTED_SCOPES: "user.info.basic,video.list", CCPUN_APP_ENV: "production-admin" }).status, "configuration-required");
});

test("Meta discovery uses bearer auth and returns only sanitized Page and Instagram identity", async () => {
  const requests: Array<{ url: string; authorization: string }> = [];
  const result = await fetchMetaReadOnlyDiscovery({
    ...lane,
    CCPUN_META_ACCESS_TOKEN: "meta-access",
    CCPUN_META_GRAPH_VERSION: "v24.0",
    CCPUN_META_GRANTED_SCOPES: "pages_show_list,pages_read_engagement,instagram_basic",
  }, async (input, init) => {
    const url = String(input);
    requests.push({ url, authorization: new Headers(init?.headers).get("authorization") ?? "" });
    if (url.includes("/me/accounts")) return new Response(JSON.stringify({ data: [
      { id: "page-1", name: "CCPun", access_token: "page-access", instagram_business_account: { id: "ig-1", username: "ccpun" } },
    ] }), { status: 200 });
    if (url.includes("/published_posts")) return new Response(JSON.stringify({ data: [{
      id: "facebook-post-1", message: "One", created_time: "2026-08-31T10:00:00+00:00",
      shares: { count: 3 }, comments: { summary: { total_count: 2 } }, reactions: { summary: { total_count: 10 } },
    }] }));
    return new Response(JSON.stringify({ data: [{ id: "ig-post-1", caption: "IG", media_type: "IMAGE", timestamp: "2026-08-31T10:00:00+00:00", like_count: 20, comments_count: 4 }] }));
  });
  assert.match(requests[0]!.url, /^https:\/\/graph\.facebook\.com\/v24\.0\/me\/accounts\?/);
  assert.equal(requests.every((request) => !request.url.includes("meta-access") && !request.url.includes("page-access")), true);
  assert.deepEqual(requests.map((request) => request.authorization), ["Bearer meta-access", "Bearer page-access", "Bearer page-access"]);
  assert.equal(result.mode, "provider-read-only");
  assert.equal(result.status, "connected");
  assert.equal(result.providerRequestAllowed, true);
  assert.equal(result.providerWriteAllowed, false);
  assert.equal(JSON.stringify(result).includes("meta-access"), false);
  assert.equal(JSON.stringify(result).includes("page-access"), false);
  assert.deepEqual(result.facebookPosts[0]?.metrics, { likes: 10, comments: 2, shares: 3 });
  const matched = matchMetaHistoricalAnalytics([
    { publicationId: "facebook-publication", platform: "facebook", platformObjectId: "facebook-post-1" },
    { publicationId: "instagram-publication", platform: "instagram", platformObjectId: "ig-post-1" },
  ], result);
  assert.equal(matched.snapshots.length, 2);
  assert.deepEqual(matched.snapshots.map((snapshot) => snapshot.source), ["meta", "meta"]);
});

test("YouTube manual read returns channel and recent video metrics without exposing the token", async () => {
  const requests: string[] = [];
  const result = await fetchYouTubeReadOnlyDiscovery({
    ...lane,
    CCPUN_YOUTUBE_ACCESS_TOKEN: "youtube-access",
    CCPUN_YOUTUBE_GRANTED_SCOPES: "https://www.googleapis.com/auth/youtube.readonly",
  }, async (input, init) => {
    const url = String(input);
    requests.push(url);
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer youtube-access");
    if (url.includes("/channels?")) return new Response(JSON.stringify({ items: [{
      id: "channel_1", snippet: { title: "CCPun" }, contentDetails: { relatedPlaylists: { uploads: "uploads_1" } },
      statistics: { viewCount: "1000", subscriberCount: "50", videoCount: "2" },
    }] }));
    if (url.includes("/playlistItems?")) return new Response(JSON.stringify({ items: [{ contentDetails: { videoId: "video_1" } }] }));
    return new Response(JSON.stringify({ items: [{ id: "video_1", snippet: { title: "Video One", publishedAt: "2026-08-31T10:00:00Z" }, statistics: { viewCount: "100", likeCount: "10", commentCount: "2" } }] }));
  });
  assert.equal(requests.length, 3);
  assert.equal(requests.every((url) => !url.includes("youtube-access")), true);
  assert.deepEqual(result.videos[0]?.metrics, { views: 100, likes: 10, comments: 2 });
  assert.equal(result.providerWriteAllowed, false);
  const matched = matchYouTubeHistoricalAnalytics([{ publicationId: "publication-1", platform: "youtube", platformObjectId: "video_1" }], result);
  assert.deepEqual(matched.snapshots[0]?.nativeMetrics.map((metric) => metric.key), ["youtube.views", "youtube.likes", "youtube.comments"]);
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
  for (const provider of ["meta", "youtube", "tiktok"] as const) {
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
  assert.match(client, /Sync YouTube แบบอ่านอย่างเดียว/);
  assert.match(tiktokPage, /video\.upload และ video\.publish ถูกปฏิเสธ/);
  assert.doesNotMatch(client, /accessToken|refreshToken|clientSecret/);
});
