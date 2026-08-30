import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMetaAnalytics, normalizeTikTokAnalytics, normalizeYouTubeAnalytics } from "../../lib/admin/social/provider-adapters";

test("Social provider adapters preserve native metrics and reject credential-shaped input", () => {
  const fetchedAt = "2026-08-29T01:00:00.000Z";
  const meta = normalizeMetaAnalytics({ publicationId: "publication-meta-1", platform: "facebook", fetchedAt, metrics: { reach: 100, shares: 5 } });
  const youtube = normalizeYouTubeAnalytics({ publicationId: "publication-youtube-1", fetchedAt, metrics: { views: 200, estimatedMinutesWatched: 80 } });
  const tiktok = normalizeTikTokAnalytics({ publicationId: "publication-tiktok-1", fetchedAt, metrics: { viewCount: 300, shareCount: 7 } });

  assert.deepEqual(meta.nativeMetrics.map((item) => item.key), ["facebook.reach", "facebook.shares"]);
  assert.deepEqual(youtube.nativeMetrics.map((item) => item.key), ["youtube.views", "youtube.estimatedMinutesWatched"]);
  assert.deepEqual(tiktok.nativeMetrics.map((item) => item.key), ["tiktok.view_count", "tiktok.share_count"]);
  assert.throws(() => normalizeMetaAnalytics({ publicationId: "publication-meta-1", platform: "facebook", fetchedAt, metrics: { reach: 1 }, accessToken: "forbidden" }));
});
