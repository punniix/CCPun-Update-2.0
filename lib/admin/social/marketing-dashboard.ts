import "server-only";

import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import type {
  MarketingCoverage,
  MarketingDashboardData,
  MarketingPost,
} from "./marketing-dashboard-model";
import { fallbackPostsFromRaw } from "./marketing-dashboard-model";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH } from "./provider-readonly";
import {
  SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
  SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION,
  resolveSocialRuntime,
  socialAnalyticsMigrationForLane,
} from "./runtime";

if (typeof window !== "undefined") throw new Error("SOCIAL_MARKETING_DASHBOARD_SERVER_ONLY");

export const SOCIAL_MARKETING_MART_P2_VERSION = "20260902_social_marketing_mart_p2_full_backfill_clean";
export const SOCIAL_MARKETING_MART_P2_CHECKSUM = "sha256:1dfbe426656ada42fa59f4b0d0727a39c293534abf964690bbbe0d8c6294727f";
export const SOCIAL_MARKETING_MART_PROVENANCE_VERSION = "20260902_social_marketing_mart_p2_metric_provenance";
export const SOCIAL_MARKETING_MART_PROVENANCE_CHECKSUM = "sha256:5b421a7bb67798d6b45911c1b05e3f54bc9f50c0482b48857f6780e7379ef866";
export const SOCIAL_MARKETING_DASHBOARD_PREVIEW_BRANCH = "feat/marketing-dashboard-full-win-20260902";

const nullableNumber = z.union([z.null(), z.coerce.number()]);

const postRowsSchema = z.array(z.object({
  content_id: z.string().trim().min(1).max(120),
  publication_id: z.string().trim().min(1).max(120).nullable(),
  provider: z.literal("meta"),
  platform: z.enum(["facebook", "instagram"]),
  provider_object_id: z.string().trim().min(1).max(200),
  permalink: z.string().min(1).max(1_000).nullable(),
  thumbnail: z.string().min(1).max(2_000).nullable(),
  text_content: z.string().max(50_000),
  provider_media_type: z.string().trim().min(1).max(80),
  format_standard: z.string().trim().min(1).max(80),
  published_at_utc: z.coerce.date(),
  published_at_bkk_text: z.string().trim().min(1).max(40),
  publish_date_bkk: z.string().trim().min(10).max(10),
  publish_day_of_week: z.coerce.number().int().min(1).max(7),
  publish_hour_bkk: z.coerce.number().int().min(0).max(23),
  snapshot_at: z.coerce.date(),
  post_age_hours: nullableNumber,
  metric_window: z.string().trim().min(1).max(40),
  reactions_total: nullableNumber,
  likes: nullableNumber,
  comments_total: nullableNumber,
  shares: nullableNumber,
  saves: nullableNumber,
  reach: nullableNumber,
  impressions: nullableNumber,
  views: nullableNumber,
  clicks: nullableNumber,
  total_interactions: nullableNumber,
  reaction_like: nullableNumber,
  reaction_love: nullableNumber,
  reaction_care: nullableNumber,
  reaction_wow: nullableNumber,
  reaction_haha: nullableNumber,
  reaction_sad: nullableNumber,
  reaction_angry: nullableNumber,
  reel_total_watch_time_ms: nullableNumber,
  reel_average_watch_time_ms: nullableNumber,
  known_engagement_total: nullableNumber,
  known_deep_engagement_total: nullableNumber,
  known_engagement_rate_by_reach: nullableNumber,
  known_deep_engagement_rate_by_reach: nullableNumber,
  clicks_per_view: nullableNumber,
  expected_core_metric_count: z.coerce.number().int().nonnegative(),
  available_core_metric_count: z.coerce.number().int().nonnegative(),
  metric_coverage_rate: nullableNumber,
  engagement_components_complete: z.boolean(),
  comment_attribution_status: z.string().trim().min(1).max(80),
  facebook_share_quality_status: z.string().trim().min(1).max(80).nullable(),
  facebook_share_quality_note: z.string().max(2_000).nullable(),
  facebook_reaction_definition_status: z.string().trim().min(1).max(80),
  instagram_interaction_definition_status: z.string().trim().min(1).max(80),
  data_quality_status: z.string().trim().min(1).max(80),
  analysis_status: z.string().trim().min(1).max(80),
})).max(10_000);

const rawMetricSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.number().nonnegative(),
}).passthrough();

const rawRowsSchema = z.array(z.object({
  content_id: z.string().trim().min(1).max(120),
  linked_publication_id: z.string().trim().min(1).max(120).nullable(),
  provider: z.literal("meta"),
  platform: z.enum(["facebook", "instagram"]),
  provider_object_id: z.string().trim().min(1).max(200),
  published_at: z.coerce.date(),
  text_content: z.string().max(50_000),
  media_type: z.string().trim().min(1).max(80),
  permalink_url: z.string().min(1).max(1_000).nullable(),
  thumbnail_url: z.string().min(1).max(2_000).nullable(),
  fetched_at: z.coerce.date().nullable(),
  native_metrics: z.array(rawMetricSchema).max(20).nullable(),
})).max(10_000);

const coverageRowsSchema = z.array(z.object({
  provider: z.literal("meta"),
  platform: z.enum(["facebook", "instagram"]),
  metric_key: z.string().trim().min(1).max(80),
  native_metric_key: z.string().trim().min(1).max(120).nullable(),
  total_posts: z.coerce.number().int().nonnegative(),
  eligible_posts: z.coerce.number().int().nonnegative(),
  available_posts: z.coerce.number().int().nonnegative(),
  not_returned_posts: z.coerce.number().int().nonnegative(),
  not_fetched_posts: z.coerce.number().int().nonnegative(),
  unsupported_posts: z.coerce.number().int().nonnegative(),
  not_requested_posts: z.coerce.number().int().nonnegative(),
  permission_denied_posts: z.coerce.number().int().nonnegative(),
  rate_limited_posts: z.coerce.number().int().nonnegative(),
  fetch_error_posts: z.coerce.number().int().nonnegative(),
  availability_rate: nullableNumber,
})).max(10_000);

const verificationSchema = z.array(z.object({
  database_name: z.string(),
  role_name: z.string(),
  analytics_current: z.boolean(),
  history_current: z.boolean(),
  mart_current: z.boolean(),
  provenance_current: z.boolean(),
  identity_current: z.boolean(),
})).max(1);

function resolvedMarketingRuntime(env: Record<string, string | undefined>) {
  return env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1"
    ? resolveSocialRuntime(env, {
      uatBranches: [WEBSITE_42_SOCIAL_ANALYTICS_BRANCH, SOCIAL_MARKETING_DASHBOARD_PREVIEW_BRANCH],
      requireUatNeon: true,
    })
    : null;
}

export function getSocialMarketingDashboardRuntimeStatus(env: Record<string, string | undefined> = process.env) {
  const runtime = resolvedMarketingRuntime(env);
  return {
    enabled: Boolean(runtime),
    mode: runtime?.lane === "production" ? "clean-mart" as const : "read-only-preview" as const,
    providerWriteAllowed: false as const,
    backgroundSyncAllowed: false as const,
  };
}

async function verifiedSql(env: Record<string, string | undefined>) {
  const runtime = resolvedMarketingRuntime(env);
  if (!runtime) throw new Error("SOCIAL_MARKETING_DASHBOARD_NOT_CONFIGURED");

  const identity = runtime.neonIdentity;
  const analytics = socialAnalyticsMigrationForLane(runtime.lane);
  const sql = neon(env.CCPUN_SOCIAL_DATABASE_URL!.trim(), {
    fetchOptions: { signal: AbortSignal.timeout(30_000) },
  });
  const rows = verificationSchema.parse(await sql.query(
    `SELECT current_database() AS database_name,current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$1 AND checksum=$2) AS analytics_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$3 AND checksum=$4) AS history_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$5 AND checksum=$6) AS mart_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$7 AND checksum=$8) AS provenance_current,
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$9 AND branch_id=$10
         AND endpoint_id=$11 AND database_name=$12 AND migration_version=$1 AND migration_checksum=$2) AS identity_current`,
    [analytics.version, analytics.checksum,
      SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION, SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
      SOCIAL_MARKETING_MART_P2_VERSION, SOCIAL_MARKETING_MART_P2_CHECKSUM,
      SOCIAL_MARKETING_MART_PROVENANCE_VERSION, SOCIAL_MARKETING_MART_PROVENANCE_CHECKSUM,
      identity.projectId, identity.branchId, identity.endpointId, identity.database],
  ));
  const row = rows[0];
  const cleanMartRequired = runtime.lane === "production";
  if (!row || row.database_name !== identity.database || row.role_name !== identity.role
    || !row.analytics_current || !row.history_current || !row.identity_current
    || (cleanMartRequired && (!row.mart_current || !row.provenance_current))) {
    throw new Error("SOCIAL_MARKETING_DASHBOARD_IDENTITY_MISMATCH");
  }
  return { sql, runtime };
}

function safeProviderUrl(value: string | null, platform: "facebook" | "instagram", kind: "permalink" | "thumbnail") {
  if (!value) return null;
  const allowed = kind === "permalink"
    ? { facebook: ["facebook.com", "fb.com"], instagram: ["instagram.com"] }[platform]
    : { facebook: ["fbcdn.net"], instagram: ["cdninstagram.com", "fbcdn.net"] }[platform];
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password
      && allowed.some((domain) => host === domain || host.endsWith(`.${domain}`)) ? url.toString() : null;
  } catch {
    return null;
  }
}

function postFromRow(row: z.infer<typeof postRowsSchema>[number]): MarketingPost {
  return {
    contentId: row.content_id,
    publicationId: row.publication_id,
    provider: row.provider,
    platform: row.platform,
    providerObjectId: row.provider_object_id,
    permalink: safeProviderUrl(row.permalink, row.platform, "permalink"),
    thumbnail: safeProviderUrl(row.thumbnail, row.platform, "thumbnail"),
    text: row.text_content,
    providerMediaType: row.provider_media_type,
    formatStandard: row.format_standard,
    publishedAtUtc: row.published_at_utc.toISOString(),
    publishedAtBkk: row.published_at_bkk_text,
    publishDateBkk: row.publish_date_bkk,
    publishDayOfWeek: row.publish_day_of_week,
    publishHourBkk: row.publish_hour_bkk,
    snapshotAt: row.snapshot_at.toISOString(),
    postAgeHours: row.post_age_hours,
    metricWindow: row.metric_window,
    reactionsTotal: row.reactions_total,
    likes: row.likes,
    commentsTotal: row.comments_total,
    shares: row.shares,
    saves: row.saves,
    reach: row.reach,
    impressions: row.impressions,
    views: row.views,
    clicks: row.clicks,
    totalInteractions: row.total_interactions,
    reactionLike: row.reaction_like,
    reactionLove: row.reaction_love,
    reactionCare: row.reaction_care,
    reactionWow: row.reaction_wow,
    reactionHaha: row.reaction_haha,
    reactionSad: row.reaction_sad,
    reactionAngry: row.reaction_angry,
    reelTotalWatchTimeMs: row.reel_total_watch_time_ms,
    reelAverageWatchTimeMs: row.reel_average_watch_time_ms,
    knownEngagementTotal: row.known_engagement_total,
    knownDeepEngagementTotal: row.known_deep_engagement_total,
    knownEngagementRateByReach: row.known_engagement_rate_by_reach,
    knownDeepEngagementRateByReach: row.known_deep_engagement_rate_by_reach,
    clicksPerView: row.clicks_per_view,
    expectedCoreMetricCount: row.expected_core_metric_count,
    availableCoreMetricCount: row.available_core_metric_count,
    metricCoverageRate: row.metric_coverage_rate,
    engagementComponentsComplete: row.engagement_components_complete,
    commentAttributionStatus: row.comment_attribution_status,
    facebookShareQualityStatus: row.facebook_share_quality_status,
    facebookShareQualityNote: row.facebook_share_quality_note,
    facebookReactionDefinitionStatus: row.facebook_reaction_definition_status,
    instagramInteractionDefinitionStatus: row.instagram_interaction_definition_status,
    dataQualityStatus: row.data_quality_status,
    analysisStatus: row.analysis_status,
  };
}

function coverageFromRow(row: z.infer<typeof coverageRowsSchema>[number]): MarketingCoverage {
  return {
    provider: row.provider,
    platform: row.platform,
    metricKey: row.metric_key,
    nativeMetricKey: row.native_metric_key,
    totalPosts: row.total_posts,
    eligiblePosts: row.eligible_posts,
    availablePosts: row.available_posts,
    notReturnedPosts: row.not_returned_posts,
    notFetchedPosts: row.not_fetched_posts,
    unsupportedPosts: row.unsupported_posts,
    notRequestedPosts: row.not_requested_posts,
    permissionDeniedPosts: row.permission_denied_posts,
    rateLimitedPosts: row.rate_limited_posts,
    fetchErrorPosts: row.fetch_error_posts,
    availabilityRate: row.availability_rate,
  };
}

export async function getSocialMarketingDashboard(
  env: Record<string, string | undefined> = process.env,
): Promise<MarketingDashboardData> {
  const { sql, runtime } = await verifiedSql(env);
  if (runtime.lane === "uat") {
    const rawRows = rawRowsSchema.parse(await sql.query(
      `SELECT content.id AS content_id,content.linked_publication_id,content.provider,content.platform,
        content.provider_object_id,content.published_at,content.text_content,content.media_type,
        content.permalink_url,content.thumbnail_url,latest.fetched_at,latest.native_metrics
       FROM ccpun_social.social_provider_content AS content
       LEFT JOIN LATERAL (
         SELECT snapshot.fetched_at,snapshot.native_metrics
         FROM ccpun_social.social_provider_metric_snapshot AS snapshot
         WHERE snapshot.content_id=content.id ORDER BY snapshot.fetched_at DESC LIMIT 1
       ) AS latest ON true
       WHERE content.provider='meta' AND content.platform IN ('facebook','instagram')
       ORDER BY content.published_at DESC,content.id`,
    ));
    const posts = fallbackPostsFromRaw(rawRows.map((row) => ({
      contentId: row.content_id,
      publicationId: row.linked_publication_id ?? row.content_id,
      linkedPublicationId: row.linked_publication_id,
      provider: row.provider,
      platform: row.platform,
      platformObjectId: row.provider_object_id,
      fetchedAt: (row.fetched_at ?? row.published_at).toISOString(),
      format: row.media_type,
      mediaType: row.media_type,
      text: row.text_content,
      permalink: safeProviderUrl(row.permalink_url, row.platform, "permalink"),
      thumbnail: safeProviderUrl(row.thumbnail_url, row.platform, "thumbnail"),
      publishedAt: row.published_at.toISOString(),
      metrics: row.native_metrics ?? [],
    })));
    return {
      posts,
      coverage: [],
      latestSnapshotAt: posts.map((post) => post.snapshotAt).sort().at(-1) ?? null,
      sourceMode: "raw-fallback" as const,
    };
  }
  const [postRows, coverageRows] = await Promise.all([
    sql.query(
      `SELECT content_id,publication_id,provider,platform,provider_object_id,permalink,thumbnail,text_content,
        provider_media_type,format_standard,published_at_utc,
        to_char(published_at_bkk,'YYYY-MM-DD HH24:MI:SS') AS published_at_bkk_text,
        publish_date_bkk::text,publish_day_of_week,publish_hour_bkk,snapshot_at,post_age_hours,metric_window,
        reactions_total,likes,comments_total,shares,saves,reach,impressions,views,clicks,total_interactions,
        reaction_like,reaction_love,reaction_care,reaction_wow,reaction_haha,reaction_sad,reaction_angry,
        reel_total_watch_time_ms,reel_average_watch_time_ms,known_engagement_total,known_deep_engagement_total,
        known_engagement_rate_by_reach,known_deep_engagement_rate_by_reach,clicks_per_view,
        expected_core_metric_count,available_core_metric_count,metric_coverage_rate,engagement_components_complete,
        comment_attribution_status,facebook_share_quality_status,facebook_share_quality_note,
        facebook_reaction_definition_status,instagram_interaction_definition_status,data_quality_status,analysis_status
       FROM ccpun_social.post_performance_clean
       WHERE provider='meta' AND platform IN ('facebook','instagram')
       ORDER BY published_at_utc DESC,content_id`,
    ),
    sql.query(
      `SELECT provider,platform,metric_key,native_metric_key,total_posts,eligible_posts,available_posts,
        not_returned_posts,not_fetched_posts,unsupported_posts,not_requested_posts,permission_denied_posts,
        rate_limited_posts,fetch_error_posts,availability_rate
       FROM ccpun_social.post_metric_coverage_summary
       WHERE provider='meta' AND platform IN ('facebook','instagram')
       ORDER BY platform,metric_key`,
    ),
  ]);
  const posts = postRowsSchema.parse(postRows).map(postFromRow);
  const coverage = coverageRowsSchema.parse(coverageRows).map(coverageFromRow);
  const latestSnapshotAt = posts.map((post) => post.snapshotAt).sort().at(-1) ?? null;
  return { posts, coverage, latestSnapshotAt, sourceMode: "clean-mart" };
}
