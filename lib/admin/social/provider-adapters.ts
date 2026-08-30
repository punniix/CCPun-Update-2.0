import { z } from "zod";
import { socialMetricSnapshotSchema } from "./operations";

const common = {
  publicationId: z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/),
  fetchedAt: z.string().datetime(),
};

const count = z.number().int().nonnegative();

const metaSnapshotSchema = z.object({
  ...common,
  platform: z.enum(["facebook", "instagram"]),
  metrics: z.object({
    views: count.optional(),
    reach: count.optional(),
    likes: count.optional(),
    comments: count.optional(),
    shares: count.optional(),
    saves: count.optional(),
  }).strict(),
}).strict();

const youtubeSnapshotSchema = z.object({
  ...common,
  metrics: z.object({
    views: count.optional(),
    likes: count.optional(),
    comments: count.optional(),
    shares: count.optional(),
    estimatedMinutesWatched: z.number().nonnegative().optional(),
    averageViewDurationSeconds: z.number().nonnegative().optional(),
  }).strict(),
}).strict();

const tiktokSnapshotSchema = z.object({
  ...common,
  metrics: z.object({
    viewCount: count.optional(),
    likeCount: count.optional(),
    commentCount: count.optional(),
    shareCount: count.optional(),
  }).strict(),
}).strict();

type Metric = z.input<typeof socialMetricSnapshotSchema>["nativeMetrics"][number];

function metric(key: string, label: string, value: number | undefined, dimension: Metric["dimension"], unit: Metric["unit"] = "count"): Metric[] {
  return value === undefined ? [] : [{ key, label, value, dimension, unit }];
}

export function normalizeMetaAnalytics(input: unknown) {
  const value = metaSnapshotSchema.parse(input);
  const prefix = value.platform;
  return socialMetricSnapshotSchema.parse({
    publicationId: value.publicationId,
    platform: value.platform,
    source: "meta",
    fetchedAt: value.fetchedAt,
    nativeMetrics: [
      ...metric(`${prefix}.views`, "Views", value.metrics.views, "discovery"),
      ...metric(`${prefix}.reach`, "Reach", value.metrics.reach, "discovery"),
      ...metric(`${prefix}.likes`, "Likes", value.metrics.likes, "engagement"),
      ...metric(`${prefix}.comments`, "Comments", value.metrics.comments, "engagement"),
      ...metric(`${prefix}.shares`, "Shares", value.metrics.shares, "deep-engagement"),
      ...metric(`${prefix}.saves`, "Saves", value.metrics.saves, "deep-engagement"),
    ],
    limitations: ["Native Meta metrics are preserved by name and are not equated with another platform."],
  });
}

export function normalizeYouTubeAnalytics(input: unknown) {
  const value = youtubeSnapshotSchema.parse(input);
  return socialMetricSnapshotSchema.parse({
    publicationId: value.publicationId,
    platform: "youtube",
    source: "youtube",
    fetchedAt: value.fetchedAt,
    nativeMetrics: [
      ...metric("youtube.views", "Views", value.metrics.views, "discovery"),
      ...metric("youtube.likes", "Likes", value.metrics.likes, "engagement"),
      ...metric("youtube.comments", "Comments", value.metrics.comments, "engagement"),
      ...metric("youtube.shares", "Shares", value.metrics.shares, "deep-engagement"),
      ...metric("youtube.estimatedMinutesWatched", "Estimated minutes watched", value.metrics.estimatedMinutesWatched, "retention", "minutes"),
      ...metric("youtube.averageViewDuration", "Average view duration", value.metrics.averageViewDurationSeconds, "retention", "seconds"),
    ],
    limitations: ["YouTube Analytics values remain native observations and do not establish causation."],
  });
}

export function normalizeTikTokAnalytics(input: unknown) {
  const value = tiktokSnapshotSchema.parse(input);
  return socialMetricSnapshotSchema.parse({
    publicationId: value.publicationId,
    platform: "tiktok",
    source: "tiktok",
    fetchedAt: value.fetchedAt,
    nativeMetrics: [
      ...metric("tiktok.view_count", "Views", value.metrics.viewCount, "discovery"),
      ...metric("tiktok.like_count", "Likes", value.metrics.likeCount, "engagement"),
      ...metric("tiktok.comment_count", "Comments", value.metrics.commentCount, "engagement"),
      ...metric("tiktok.share_count", "Shares", value.metrics.shareCount, "deep-engagement"),
    ],
    limitations: ["TikTok video fields are historical counters returned for an authorized video."],
  });
}
