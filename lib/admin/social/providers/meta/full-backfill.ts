import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { normalizeMetaAnalytics } from "../../provider-adapters";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH } from "../../provider-readonly";
import {
  resolveSocialRuntime,
  SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
  SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION,
  socialAnalyticsMigrationForLane,
} from "../../runtime";
import {
  fetchMetaInsightsDetailed,
  mapWithConcurrency,
  reactionBreakdownInsight,
  type MetaInsightObservation,
  type MetaInsightValue,
} from "./insights-read";

if (typeof window !== "undefined") throw new Error("META_FULL_BACKFILL_SERVER_ONLY");

export const META_INSIGHTS_BACKFILL_PROFILE = "meta-p1-insights-v1";
export const META_INSIGHTS_BACKFILL_BATCH_SIZE = 50;
export const SOCIAL_MARKETING_MART_P1_VERSION = "20260902_social_marketing_mart_p1_meta_insights";
export const SOCIAL_MARKETING_MART_P1_CHECKSUM = "sha256:7bdc2c2b80b59d7364d92ec88dd66ccd5472390291bf0bc3ba82ec424718f671";
export const SOCIAL_MARKETING_MART_P2_VERSION = "20260902_social_marketing_mart_p2_full_backfill_clean";
export const SOCIAL_MARKETING_MART_P2_CHECKSUM = "sha256:1dfbe426656ada42fa59f4b0d0727a39c293534abf964690bbbe0d8c6294727f";

const metricSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  value: z.number().nonnegative(),
  unit: z.enum(["count", "seconds", "minutes", "milliseconds"]),
  dimension: z.enum(["discovery", "engagement", "deep-engagement", "retention", "business-intent"]),
});
type NativeMetric = z.infer<typeof metricSchema>;

const contentBatchSchema = z.array(z.object({
  content_id: z.string().trim().min(1).max(120),
  platform: z.enum(["facebook", "instagram"]),
  provider_object_id: z.string().trim().min(1).max(200),
  media_type: z.string().trim().min(1).max(80),
  latest_native_metrics: z.array(metricSchema).min(1).max(20).nullable(),
})).max(META_INSIGHTS_BACKFILL_BATCH_SIZE);

const accountResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string().trim().min(1).max(120),
    access_token: z.string().trim().min(1).max(4096).nullable().optional(),
  })).max(100),
});

const countSchema = z.array(z.object({ count: z.coerce.number().int().nonnegative() })).max(1);

const canonicalStatusSchema = z.object({
  key: z.string().trim().min(1).max(80),
  status: z.enum(["available", "not_returned", "unsupported", "permission_denied", "rate_limited", "fetch_error"]),
});
type CanonicalStatus = z.infer<typeof canonicalStatusSchema>;

type FetchLike = typeof fetch;

type BackfillMetricFields = {
  views?: number;
  reach?: number;
  clicks?: number;
  saves?: number;
  shares?: number;
  totalInteractions?: number;
  reelTotalWatchTimeMs?: number;
  reelAverageWatchTimeMs?: number;
  reactionLike?: number;
  reactionLove?: number;
  reactionCare?: number;
  reactionWow?: number;
  reactionHaha?: number;
  reactionSad?: number;
  reactionAngry?: number;
};

function digest(parts: unknown[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

function safeActorRef(actor: string) {
  return `admin:${createHash("sha256").update(actor).digest("hex").slice(0, 32)}`;
}

function canonicalMetrics(metrics: NativeMetric[]) {
  const byKey = new Map(metrics.map((metric) => [metric.key, metric]));
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key, "en"));
}

function metricsHash(metrics: NativeMetric[]) {
  return digest(canonicalMetrics(metrics).map((metric) => [metric.key, metric.label, metric.value, metric.unit, metric.dimension]));
}

function mergeMetrics(existing: NativeMetric[], added: NativeMetric[]) {
  return canonicalMetrics([...existing, ...added]);
}

const transientStatuses = new Set(["permission_denied", "rate_limited", "fetch_error"]);

function nativeMetricKey(platform: "facebook" | "instagram", canonicalKey: string) {
  const mapped: Record<string, string> = platform === "facebook" ? {
    views: "facebook.views",
    clicks: "facebook.clicks",
    reaction_like: "facebook.reaction_like",
    reaction_love: "facebook.reaction_love",
    reaction_care: "facebook.reaction_care",
    reaction_wow: "facebook.reaction_wow",
    reaction_haha: "facebook.reaction_haha",
    reaction_sad: "facebook.reaction_sad",
    reaction_angry: "facebook.reaction_angry",
  } : {
    views: "instagram.views",
    reach: "instagram.reach",
    saves: "instagram.saves",
    shares: "instagram.shares",
    total_interactions: "instagram.total_interactions",
    reel_total_watch_time_ms: "instagram.ig_reels_video_view_total_time",
    reel_average_watch_time_ms: "instagram.ig_reels_avg_watch_time",
  };
  return mapped[canonicalKey] ?? null;
}

function retainPreviousMetrics(
  previous: NativeMetric[],
  platform: "facebook" | "instagram",
  statuses: CanonicalStatus[],
) {
  const replaceKeys = new Set(statuses.flatMap((status) => {
    if (transientStatuses.has(status.status)) return [];
    const key = nativeMetricKey(platform, status.key);
    return key ? [key] : [];
  }));
  return previous.filter((metric) => !replaceKeys.has(metric.key));
}

function observationMap(observations: MetaInsightObservation[]) {
  return new Map(observations.map((observation) => [observation.metric, observation]));
}

function directMetric(
  observations: Map<string, MetaInsightObservation>,
  providerMetric: string,
  canonicalKey: string,
  field: keyof BackfillMetricFields,
  fields: BackfillMetricFields,
  statuses: CanonicalStatus[],
) {
  const observation = observations.get(providerMetric);
  if (!observation) {
    statuses.push({ key: canonicalKey, status: "fetch_error" });
    return;
  }
  if (observation.status !== "available") {
    statuses.push({ key: canonicalKey, status: observation.status });
    return;
  }
  if (typeof observation.value !== "number" || !Number.isFinite(observation.value) || observation.value < 0) {
    statuses.push({ key: canonicalKey, status: "fetch_error" });
    return;
  }
  fields[field] = observation.value;
  statuses.push({ key: canonicalKey, status: "available" });
}

function reactionMetrics(
  observations: Map<string, MetaInsightObservation>,
  fields: BackfillMetricFields,
  statuses: CanonicalStatus[],
) {
  const source = observations.get("post_reactions_by_type_total");
  const definitions = [
    ["reaction_like", "reactionLike", "like"],
    ["reaction_love", "reactionLove", "love"],
    ["reaction_care", "reactionCare", "care"],
    ["reaction_wow", "reactionWow", "wow"],
    ["reaction_haha", "reactionHaha", "haha"],
    ["reaction_sad", "reactionSad", "sad"],
    ["reaction_angry", "reactionAngry", "angry"],
  ] as const;
  if (!source) {
    for (const [key] of definitions) statuses.push({ key, status: "fetch_error" });
    return;
  }
  if (source.status !== "available") {
    for (const [key] of definitions) statuses.push({ key, status: source.status });
    return;
  }
  if (!source.value || typeof source.value === "number") {
    for (const [key] of definitions) statuses.push({ key, status: "fetch_error" });
    return;
  }
  const values = new Map<string, MetaInsightValue>([["post_reactions_by_type_total", source.value]]);
  const breakdown = reactionBreakdownInsight(values, "post_reactions_by_type_total");
  for (const [key, field, valueKey] of definitions) {
    const value = breakdown[valueKey];
    if (value === undefined) {
      statuses.push({ key, status: "not_returned" });
      continue;
    }
    fields[field] = value;
    statuses.push({ key, status: "available" });
  }
}

function buildCollectionResult(
  row: z.infer<typeof contentBatchSchema>[number],
  observations: MetaInsightObservation[],
  fetchedAt: string,
) {
  const byMetric = observationMap(observations);
  const fields: BackfillMetricFields = {};
  const statuses: CanonicalStatus[] = [];

  if (row.platform === "facebook") {
    directMetric(byMetric, "post_media_view", "views", "views", fields, statuses);
    directMetric(byMetric, "post_clicks", "clicks", "clicks", fields, statuses);
    reactionMetrics(byMetric, fields, statuses);
  } else {
    directMetric(byMetric, "views", "views", "views", fields, statuses);
    directMetric(byMetric, "reach", "reach", "reach", fields, statuses);
    directMetric(byMetric, "saved", "saves", "saves", fields, statuses);
    directMetric(byMetric, "shares", "shares", "shares", fields, statuses);
    directMetric(byMetric, "total_interactions", "total_interactions", "totalInteractions", fields, statuses);
    if (row.media_type.toUpperCase() === "VIDEO") {
      directMetric(byMetric, "ig_reels_video_view_total_time", "reel_total_watch_time_ms", "reelTotalWatchTimeMs", fields, statuses);
      directMetric(byMetric, "ig_reels_avg_watch_time", "reel_average_watch_time_ms", "reelAverageWatchTimeMs", fields, statuses);
    }
  }

  const parsedStatuses = z.array(canonicalStatusSchema).min(1).max(20).parse(statuses);
  const transient = parsedStatuses.find((status) => transientStatuses.has(status.status));
  const availableCount = parsedStatuses.filter((status) => status.status === "available").length;
  const outcome = transient ? "failed" as const
    : parsedStatuses.every((status) => ["available", "unsupported"].includes(status.status)) ? "complete" as const
      : "partial" as const;
  const added = Object.keys(fields).length > 0
    ? normalizeMetaAnalytics({ publicationId: row.content_id, platform: row.platform, fetchedAt, metrics: fields }).nativeMetrics
    : [];
  const previous = row.latest_native_metrics ?? [];
  const retained = retainPreviousMetrics(previous, row.platform, parsedStatuses);
  const merged = mergeMetrics(retained, added);
  return {
    row,
    statuses: parsedStatuses,
    requestedKeys: parsedStatuses.map((status) => status.key),
    availableCount,
    outcome,
    errorCategory: transient?.status ?? null,
    mergedMetrics: merged,
    previousMetricsHash: previous.length ? metricsHash(previous) : null,
    mergedMetricsHash: merged.length ? metricsHash(merged) : null,
  };
}

async function verifiedSql(env: Record<string, string | undefined>) {
  const runtime = env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1"
    ? resolveSocialRuntime(env, { uatBranches: [WEBSITE_42_SOCIAL_ANALYTICS_BRANCH], requireUatNeon: true })
    : null;
  if (!runtime || runtime.lane !== "production") throw new Error("META_FULL_BACKFILL_NOT_CONFIGURED");
  const identity = runtime.neonIdentity;
  const analytics = socialAnalyticsMigrationForLane(runtime.lane);
  const sql = neon(env.CCPUN_SOCIAL_DATABASE_URL!.trim(), { fetchOptions: { signal: AbortSignal.timeout(30_000) } });
  const rows = await sql.query(
    `SELECT current_database() AS database_name,current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$1 AND checksum=$2) AS analytics_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$3 AND checksum=$4) AS history_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$5 AND checksum=$6) AS p1_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$7 AND checksum=$8) AS p2_current,
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$9 AND branch_id=$10
         AND endpoint_id=$11 AND database_name=$12 AND migration_version=$1 AND migration_checksum=$2) AS identity_current`,
    [analytics.version, analytics.checksum,
      SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION, SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
      SOCIAL_MARKETING_MART_P1_VERSION, SOCIAL_MARKETING_MART_P1_CHECKSUM,
      SOCIAL_MARKETING_MART_P2_VERSION, SOCIAL_MARKETING_MART_P2_CHECKSUM,
      identity.projectId, identity.branchId, identity.endpointId, identity.database],
  ) as Array<{ database_name: string; role_name: string; analytics_current: boolean; history_current: boolean; p1_current: boolean; p2_current: boolean; identity_current: boolean }>;
  const row = rows[0];
  if (!row || row.database_name !== identity.database || row.role_name !== identity.role
    || !row.analytics_current || !row.history_current || !row.p1_current || !row.p2_current || !row.identity_current) {
    throw new Error("META_FULL_BACKFILL_IDENTITY_MISMATCH");
  }
  return sql;
}

async function selectedPageToken(env: Record<string, string | undefined>, fetcher: FetchLike) {
  const token = env.CCPUN_META_ACCESS_TOKEN?.trim();
  const version = env.CCPUN_META_GRAPH_VERSION?.trim();
  if (!token || !version) throw new Error("META_FULL_BACKFILL_NOT_CONFIGURED");
  const url = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  url.searchParams.set("fields", "id,access_token");
  url.searchParams.set("limit", "20");
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("META_FULL_BACKFILL_UNAVAILABLE");
  }
  const body = await response.json().catch(() => null) as unknown;
  if (response.status === 401 || response.status === 403) throw new Error("META_FULL_BACKFILL_AUTH_REQUIRED");
  if (response.status === 429) throw new Error("META_FULL_BACKFILL_RATE_LIMITED");
  if (!response.ok) throw new Error("META_FULL_BACKFILL_UNAVAILABLE");
  const parsed = accountResponseSchema.safeParse(body);
  if (!parsed.success) throw new Error("META_FULL_BACKFILL_INVALID_RESPONSE");
  const selectedId = env.CCPUN_META_PAGE_ID?.trim() || (parsed.data.data.length === 1 ? parsed.data.data[0]!.id : null);
  const page = parsed.data.data.find((candidate) => candidate.id === selectedId);
  if (!page) throw new Error("META_FULL_BACKFILL_PAGE_SELECTION_REQUIRED");
  return { version, token: page.access_token ?? token };
}

function requestedProviderMetrics(platform: "facebook" | "instagram", mediaType: string) {
  if (platform === "facebook") return ["post_media_view", "post_clicks", "post_reactions_by_type_total"];
  return [
    "views", "reach", "saved", "shares", "total_interactions",
    ...(mediaType.toUpperCase() === "VIDEO" ? ["ig_reels_video_view_total_time", "ig_reels_avg_watch_time"] : []),
  ];
}

async function remainingCount(sql: Awaited<ReturnType<typeof verifiedSql>>) {
  const rows = countSchema.parse(await sql.query(
    `SELECT count(*)
     FROM ccpun_social.social_provider_content AS content
     WHERE content.provider='meta'
       AND NOT EXISTS (
         SELECT 1 FROM ccpun_social.social_provider_metric_collection_attempt AS attempt
         WHERE attempt.content_id=content.id
           AND attempt.collection_profile=$1
           AND attempt.outcome IN ('complete','partial')
       )`,
    [META_INSIGHTS_BACKFILL_PROFILE],
  ));
  return rows[0]?.count ?? 0;
}

export async function backfillMetaInsightsBatch(input: {
  actor: string;
  requestId: string;
  env?: Record<string, string | undefined>;
  fetcher?: FetchLike;
}) {
  const env = input.env ?? process.env;
  const fetcher = input.fetcher ?? fetch;
  const sql = await verifiedSql(env);
  const batch = contentBatchSchema.parse(await sql.query(
    `SELECT content.id AS content_id,content.platform,content.provider_object_id,content.media_type,
       latest.native_metrics AS latest_native_metrics
     FROM ccpun_social.social_provider_content AS content
     LEFT JOIN LATERAL (
       SELECT snapshot.native_metrics
       FROM ccpun_social.social_provider_metric_snapshot AS snapshot
       WHERE snapshot.content_id=content.id
       ORDER BY snapshot.fetched_at DESC,snapshot.created_at DESC,snapshot.id DESC LIMIT 1
     ) AS latest ON true
     LEFT JOIN LATERAL (
       SELECT attempt.outcome,attempt.attempted_at
       FROM ccpun_social.social_provider_metric_collection_attempt AS attempt
       WHERE attempt.content_id=content.id AND attempt.collection_profile=$1
       ORDER BY attempt.attempted_at DESC,attempt.created_at DESC,attempt.id DESC LIMIT 1
     ) AS previous_attempt ON true
     WHERE content.provider='meta'
       AND content.platform IN ('facebook','instagram')
       AND coalesce(previous_attempt.outcome,'') NOT IN ('complete','partial')
     ORDER BY (previous_attempt.outcome IS NOT NULL),content.platform,content.published_at DESC,content.id
     LIMIT $2`,
    [META_INSIGHTS_BACKFILL_PROFILE, META_INSIGHTS_BACKFILL_BATCH_SIZE],
  ));

  if (batch.length === 0) {
    return {
      collectionProfile: META_INSIGHTS_BACKFILL_PROFILE,
      processed: 0,
      complete: 0,
      partial: 0,
      failed: 0,
      snapshotsPrepared: 0,
      remaining: 0,
      done: true,
      persisted: true as const,
      providerWriteAllowed: false as const,
      backgroundSyncAllowed: false as const,
    };
  }

  const provider = await selectedPageToken(env, fetcher);
  const fetchedAt = new Date().toISOString();
  const results = await mapWithConcurrency(batch, 5, async (row) => {
    const observations = await fetchMetaInsightsDetailed({
      version: provider.version,
      objectId: row.provider_object_id,
      metrics: requestedProviderMetrics(row.platform, row.media_type),
      token: provider.token,
    }, fetcher);
    return buildCollectionResult(row, observations, fetchedAt);
  });

  await sql.transaction((transaction) => [
    ...results.flatMap((result) => {
      const statements = [];
      if (result.mergedMetricsHash && result.mergedMetricsHash !== result.previousMetricsHash) {
        statements.push(transaction.query(
          `INSERT INTO ccpun_social.social_provider_metric_snapshot
           (id,content_id,provider,platform,provider_object_id,fetched_at,metrics_hash,native_metrics)
           VALUES ($1,$2,'meta',$3,$4,$5::timestamptz,$6,$7::jsonb)
           ON CONFLICT (content_id,metrics_hash) DO NOTHING`,
          [`provider-metric:${digest([result.row.content_id, result.mergedMetricsHash])}`, result.row.content_id,
            result.row.platform, result.row.provider_object_id, fetchedAt, result.mergedMetricsHash,
            JSON.stringify(result.mergedMetrics)],
        ));
      }
      statements.push(transaction.query(
        `INSERT INTO ccpun_social.social_provider_metric_collection_attempt
         (id,content_id,provider,platform,collection_profile,provider_api_version,request_ref,attempted_at,outcome,
          requested_metric_keys,metric_statuses,requested_metric_count,available_metric_count,error_category)
         VALUES ($1,$2,'meta',$3,$4,$5,$6,$7::timestamptz,$8,$9::jsonb,$10::jsonb,$11,$12,$13)
         ON CONFLICT (content_id,collection_profile,request_ref) DO NOTHING`,
        [`provider-collection:${digest([result.row.content_id, META_INSIGHTS_BACKFILL_PROFILE, input.requestId])}`,
          result.row.content_id, result.row.platform, META_INSIGHTS_BACKFILL_PROFILE, provider.version, input.requestId,
          fetchedAt, result.outcome, JSON.stringify(result.requestedKeys), JSON.stringify(result.statuses),
          result.requestedKeys.length, result.availableCount, result.errorCategory],
      ));
      return statements;
    }),
    transaction.query(
      `INSERT INTO ccpun_social.social_execution_audit
       (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       VALUES ($1,'human',$2,'analytics:backfill','job',$3,$3,$4)`,
      [`audit:${input.requestId}`, safeActorRef(input.actor), input.requestId,
        results.some((result) => result.outcome === "failed") ? "failed" : "succeeded"],
    ),
  ], { isolationLevel: "Serializable" });

  const remaining = await remainingCount(sql);
  return {
    collectionProfile: META_INSIGHTS_BACKFILL_PROFILE,
    processed: results.length,
    complete: results.filter((result) => result.outcome === "complete").length,
    partial: results.filter((result) => result.outcome === "partial").length,
    failed: results.filter((result) => result.outcome === "failed").length,
    snapshotsPrepared: results.filter((result) => result.mergedMetricsHash && result.mergedMetricsHash !== result.previousMetricsHash).length,
    remaining,
    done: remaining === 0,
    persisted: true as const,
    providerWriteAllowed: false as const,
    backgroundSyncAllowed: false as const,
  };
}

export const __test = {
  canonicalMetrics,
  metricsHash,
  mergeMetrics,
  buildCollectionResult,
  requestedProviderMetrics,
  retainPreviousMetrics,
};
