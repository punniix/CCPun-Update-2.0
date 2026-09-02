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
    clicks: count.optional(),
    totalInteractions: count.optional(),
    reelTotalWatchTimeMs: count.optional(),
    reelAverageWatchTimeMs: count.optional(),
    reactionLike: count.optional(),
    reactionLove: count.optional(),
    reactionCare: count.optional(),
    reactionWow: count.optional(),
    reactionHaha: count.optional(),
    reactionSad: count.optional(),
    reactionAngry: count.optional(),
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
      ...metric(`${prefix}.clicks`, "Clicks", value.metrics.clicks, "business-intent"),
      ...metric(`${prefix}.total_interactions`, "Total interactions", value.metrics.totalInteractions, "engagement"),
      ...metric(`${prefix}.ig_reels_video_view_total_time`, "Reel total watch time", value.metrics.reelTotalWatchTimeMs, "retention", "milliseconds"),
      ...metric(`${prefix}.ig_reels_avg_watch_time`, "Reel average watch time", value.metrics.reelAverageWatchTimeMs, "retention", "milliseconds"),
      ...metric(`${prefix}.reaction_like`, "Reaction · Like", value.metrics.reactionLike, "engagement"),
      ...metric(`${prefix}.reaction_love`, "Reaction · Love", value.metrics.reactionLove, "engagement"),
      ...metric(`${prefix}.reaction_care`, "Reaction · Care", value.metrics.reactionCare, "engagement"),
      ...metric(`${prefix}.reaction_wow`, "Reaction · Wow", value.metrics.reactionWow, "engagement"),
      ...metric(`${prefix}.reaction_haha`, "Reaction · Haha", value.metrics.reactionHaha, "engagement"),
      ...metric(`${prefix}.reaction_sad`, "Reaction · Sad", value.metrics.reactionSad, "engagement"),
      ...metric(`${prefix}.reaction_angry`, "Reaction · Angry", value.metrics.reactionAngry, "engagement"),
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
