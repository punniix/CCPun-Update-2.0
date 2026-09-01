import "server-only";

import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { CCPUN_VERCEL_PROJECT_IDS, parseAdminEnvironment } from "../environment";
import { normalizeMetaAnalytics } from "./provider-adapters";
import { WEBSITE_42_SANITY_DATASET, WEBSITE_42_SANITY_PROJECT_ID } from "./foundation";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH } from "./provider-readonly";
import { fetchMetaReadOnlyDiscovery, matchMetaHistoricalAnalytics } from "./providers/meta/read-only";
import { fetchTikTokReadOnlyDiscovery, matchTikTokHistoricalAnalytics } from "./providers/tiktok/read-only";
import { fetchYouTubeReadOnlyDiscovery, matchYouTubeHistoricalAnalytics } from "./providers/youtube/read-only";

export const SOCIAL_ANALYTICS_MIGRATION_VERSION = "20260831_website_42_social_analytics_ingestion";
export const SOCIAL_ANALYTICS_MIGRATION_CHECKSUM = "sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c";
export const SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION = "20260901_website_42_social_provider_native_history";
export const SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM = "sha256:cc4c2516ad261983d3d3997796711fb9b0290afe8625ab82fc002f4536bc549c";
export const socialAnalyticsProviderSchema = z.enum(["meta", "youtube", "tiktok"]);

const UAT_NEON = {
  projectId: "young-term-47483330", branchId: "br-crimson-mouse-az7ajkv8", endpointId: "ep-mute-frost-aztvz394",
  database: "neondb", role: "ccpun_social_runtime",
} as const;
const providerFailureSchema = z.enum(["authentication", "authorization", "rate-limit", "timeout", "provider-unavailable", "invalid-response", "unknown"]);
const publicationsSchema = z.array(z.object({
  publication_id: z.string().trim().min(1).max(120), platform: z.enum(["facebook", "instagram", "youtube", "tiktok"]),
  platform_object_id: z.string().trim().min(1).max(200), published_at: z.coerce.date(),
})).max(10_000);
const metricSchema = z.object({
  key: z.string().trim().min(1).max(80), label: z.string().trim().min(1).max(120), value: z.number().nonnegative(),
  unit: z.enum(["count", "seconds", "minutes"]), dimension: z.enum(["discovery", "engagement", "deep-engagement", "retention", "business-intent"]),
});
const latestMetricsSchema = z.array(z.object({
  publication_id: z.string().trim().min(1).max(120),
  native_metrics: z.array(metricSchema).min(1).max(20),
})).max(10_000);
const syncStateSchema = z.array(z.object({
  last_success_at: z.coerce.date().nullable(),
  backfill_completed_at: z.coerce.date().nullable(),
})).max(1);
const dashboardRowsSchema = z.array(z.object({
  publication_id: z.string().trim().min(1).max(120), provider: socialAnalyticsProviderSchema,
  platform: z.enum(["facebook", "instagram", "youtube", "tiktok"]), platform_object_id: z.string().trim().min(1).max(200),
  fetched_at: z.coerce.date(), native_metrics: z.array(metricSchema).min(1).max(20), limitations: z.array(z.string()).min(1).max(10),
})).max(400);

function isExactUatConnectionString(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" && decodeURIComponent(url.username) === UAT_NEON.role && Boolean(url.password)
      && decodeURIComponent(url.pathname.slice(1)) === UAT_NEON.database
      && [`${UAT_NEON.endpointId}.c-3.ap-southeast-1.aws.neon.tech`, `${UAT_NEON.endpointId}-pooler.c-3.ap-southeast-1.aws.neon.tech`].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isSocialAnalyticsIngestionEnabled(env: Record<string, string | undefined> = process.env) {
  const projectId = env.VERCEL_PROJECT_ID?.trim() || env.NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID?.trim();
  return env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1" && parseAdminEnvironment(env.CCPUN_APP_ENV) === "admin-uat"
    && projectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction && env.VERCEL_GIT_COMMIT_REF?.trim() === WEBSITE_42_SOCIAL_ANALYTICS_BRANCH
    && env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() === WEBSITE_42_SANITY_PROJECT_ID && env.NEXT_PUBLIC_SANITY_DATASET?.trim() === WEBSITE_42_SANITY_DATASET
    && env.CCPUN_NEON_PROJECT_ID?.trim() === UAT_NEON.projectId && env.CCPUN_NEON_BRANCH_ID?.trim() === UAT_NEON.branchId
    && env.CCPUN_NEON_ENDPOINT_ID?.trim() === UAT_NEON.endpointId && env.CCPUN_NEON_DATABASE?.trim() === UAT_NEON.database
    && isExactUatConnectionString(env.CCPUN_SOCIAL_DATABASE_URL?.trim());
}

export function getSocialAnalyticsIngestionRuntimeStatus(env: Record<string, string | undefined> = process.env) {
  return { enabled: isSocialAnalyticsIngestionEnabled(env), mode: "manual-provider-read" as const, providerWriteAllowed: false as const, backgroundSyncAllowed: false as const };
}

function safeActorRef(actor: string) {
  return `admin:${createHash("sha256").update(actor).digest("hex").slice(0, 32)}`;
}

function snapshotId(publicationId: string, provider: string, fetchedAt: string) {
  return `metric:${createHash("sha256").update(`${publicationId}:${provider}:${fetchedAt}`).digest("hex")}`;
}

function digest(parts: unknown[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

function providerContentId(platform: string, providerObjectId: string) {
  return `provider-content:${digest(["meta", platform, providerObjectId])}`;
}

function metricsHash(metrics: z.infer<typeof metricSchema>[]) {
  return digest(metrics.map((metric) => [metric.key, metric.label, metric.value, metric.unit, metric.dimension]));
}

async function verifiedSql(env: Record<string, string | undefined>) {
  if (!isSocialAnalyticsIngestionEnabled(env)) throw new Error("SOCIAL_ANALYTICS_NOT_CONFIGURED");
  const sql = neon(env.CCPUN_SOCIAL_DATABASE_URL!.trim(), { fetchOptions: { signal: AbortSignal.timeout(30_000) } });
  const rows = await sql.query(
    `SELECT current_database() AS database_name, current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$1 AND checksum=$2) AS ledger_current,
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$3 AND branch_id=$4
         AND endpoint_id=$5 AND database_name=$6 AND migration_version=$1 AND migration_checksum=$2) AS identity_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$7 AND checksum=$8) AS provider_history_current`,
    [SOCIAL_ANALYTICS_MIGRATION_VERSION, SOCIAL_ANALYTICS_MIGRATION_CHECKSUM, UAT_NEON.projectId, UAT_NEON.branchId, UAT_NEON.endpointId, UAT_NEON.database,
      SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION, SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM],
  ) as Array<{ database_name: string; role_name: string; ledger_current: boolean; identity_current: boolean; provider_history_current: boolean }>;
  const row = rows[0];
  if (!row || row.database_name !== UAT_NEON.database || row.role_name !== UAT_NEON.role || !row.ledger_current || !row.identity_current || !row.provider_history_current) throw new Error("SOCIAL_ANALYTICS_IDENTITY_MISMATCH");
  return sql;
}

async function fetchProvider(provider: z.infer<typeof socialAnalyticsProviderSchema>, publications: z.infer<typeof publicationsSchema>, env: Record<string, string | undefined>, fetcher: typeof fetch, since: string | null) {
  const refs = publications.map((item) => ({ publicationId: item.publication_id, platform: item.platform, platformObjectId: item.platform_object_id }));
  if (provider === "meta") {
    const discovery = await fetchMetaReadOnlyDiscovery(env, fetcher, { since });
    if (!discovery.selectedPageId) throw new Error("META_PAGE_SELECTION_REQUIRED");
    const linked = new Map(refs.map((item) => [`${item.platform}:${item.platformObjectId}`, item.publicationId]));
    const providerContents = [
      ...discovery.facebookPosts.map((item) => ({ ...item, platform: "facebook" as const, providerAccountId: discovery.selectedPageId! })),
      ...discovery.instagramMedia.map((item) => ({ ...item, platform: "instagram" as const, providerAccountId: discovery.selectedInstagramAccountId ?? discovery.selectedPageId! })),
    ].map((item) => {
      const contentId = providerContentId(item.platform, item.id);
      const nativeMetrics = normalizeMetaAnalytics({ publicationId: contentId, platform: item.platform, fetchedAt: discovery.fetchedAt, metrics: item.metrics }).nativeMetrics;
      return {
        contentId, platform: item.platform, providerAccountId: item.providerAccountId, providerObjectId: item.id,
        linkedPublicationId: linked.get(`${item.platform}:${item.id}`) ?? null,
        publishedAt: item.publishedAt, text: item.text, mediaType: item.mediaType,
        permalink: item.permalink, thumbnailUrl: item.thumbnailUrl, nativeMetrics,
      };
    });
    return { discovery, matched: matchMetaHistoricalAnalytics(refs, discovery), accountId: discovery.selectedPageId, cursor: null, providerContents };
  }
  if (provider === "youtube") {
    const discovery = await fetchYouTubeReadOnlyDiscovery(env, fetcher);
    return { discovery, matched: matchYouTubeHistoricalAnalytics(refs, discovery), accountId: discovery.channel.id, cursor: null, providerContents: [] };
  }
  const discovery = await fetchTikTokReadOnlyDiscovery(env, fetcher);
  return { discovery, matched: matchTikTokHistoricalAnalytics(refs, discovery), accountId: discovery.profile.openId, cursor: discovery.nextCursor === null ? null : String(discovery.nextCursor), providerContents: [] };
}

export async function syncSocialHistoricalAnalytics(input: {
  provider: z.input<typeof socialAnalyticsProviderSchema>; actor: string; requestId: string;
  env?: Record<string, string | undefined>; fetcher?: typeof fetch;
}) {
  const provider = socialAnalyticsProviderSchema.parse(input.provider);
  const env = input.env ?? process.env;
  const sql = await verifiedSql(env);
  const syncState = syncStateSchema.parse(await sql.query(
    `SELECT last_success_at,backfill_completed_at FROM ccpun_social.social_provider_sync_state
     WHERE provider=$1 ORDER BY last_success_at DESC NULLS LAST LIMIT 1`,
    [provider],
  ))[0];
  const since = provider === "meta" && syncState?.backfill_completed_at && syncState.last_success_at
    ? new Date(syncState.last_success_at.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const publications = publicationsSchema.parse(await sql.query(
    `SELECT publication.id AS publication_id, variant.channel AS platform, publication.platform_object_id, publication.published_at
     FROM ccpun_social.social_publication AS publication JOIN ccpun_social.social_variant_link AS variant ON variant.variant_id=publication.variant_id
     WHERE publication.status='published' AND variant.channel IN ('facebook','instagram','youtube','tiktok') AND publication.platform_object_id IS NOT NULL`,
  ));
  const platforms = provider === "meta" ? new Set(["facebook", "instagram"]) : new Set([provider]);
  const relevant = publications.filter((publication) => platforms.has(publication.platform));
  const { discovery, matched, accountId, cursor, providerContents } = await fetchProvider(provider, relevant, env, input.fetcher ?? fetch, since);
  const publishedAt = new Map(relevant.map((publication) => [publication.publication_id, publication.published_at.getTime()]));
  const objectIds = new Map(relevant.map((publication) => [publication.publication_id, publication.platform_object_id]));
  const candidates = matched.snapshots.filter((snapshot) => Date.parse(snapshot.fetchedAt) >= (publishedAt.get(snapshot.publicationId) ?? Number.POSITIVE_INFINITY));
  const latestMetrics = latestMetricsSchema.parse(await sql.query(
    `SELECT DISTINCT ON (publication_id) publication_id,native_metrics FROM ccpun_social.social_metric_snapshot
     WHERE provider=$1 ORDER BY publication_id,fetched_at DESC`,
    [provider],
  ));
  const latestMetricHash = new Map(latestMetrics.map((row) => [row.publication_id, metricsHash(row.native_metrics)]));
  const snapshots = candidates.filter((snapshot) => latestMetricHash.get(snapshot.publicationId) !== metricsHash(snapshot.nativeMetrics));

  await sql.transaction((transaction) => [
    ...providerContents.flatMap((content) => {
      const contentHash = digest([content.text, content.mediaType, content.permalink, content.thumbnailUrl]);
      const nativeMetricsHash = metricsHash(content.nativeMetrics);
      return [
        transaction.query(
          `INSERT INTO ccpun_social.social_provider_content
           (id,provider,platform,provider_account_id,provider_object_id,linked_publication_id,published_at,text_content,media_type,permalink_url,thumbnail_url,latest_content_hash,first_seen_at,last_seen_at)
           VALUES ($1,'meta',$2,$3,$4,$5,$6::timestamptz,$7,$8,$9,$10,$11,$12::timestamptz,$12::timestamptz)
           ON CONFLICT (provider,platform,provider_object_id) DO UPDATE SET
             linked_publication_id=COALESCE(EXCLUDED.linked_publication_id,ccpun_social.social_provider_content.linked_publication_id),
             published_at=EXCLUDED.published_at,text_content=EXCLUDED.text_content,media_type=EXCLUDED.media_type,
             permalink_url=EXCLUDED.permalink_url,thumbnail_url=EXCLUDED.thumbnail_url,
             latest_content_hash=EXCLUDED.latest_content_hash,last_seen_at=EXCLUDED.last_seen_at,updated_at=now()`,
          [content.contentId, content.platform, content.providerAccountId, content.providerObjectId, content.linkedPublicationId,
            content.publishedAt, content.text, content.mediaType, content.permalink, content.thumbnailUrl, contentHash, discovery.fetchedAt],
        ),
        transaction.query(
          `INSERT INTO ccpun_social.social_provider_content_revision
           (id,content_id,content_hash,captured_at,text_content,media_type,permalink_url,thumbnail_url)
           VALUES ($1,$2,$3,$4::timestamptz,$5,$6,$7,$8) ON CONFLICT (content_id,content_hash) DO NOTHING`,
          [`provider-revision:${digest([content.contentId, contentHash])}`, content.contentId, contentHash, discovery.fetchedAt,
            content.text, content.mediaType, content.permalink, content.thumbnailUrl],
        ),
        transaction.query(
          `INSERT INTO ccpun_social.social_provider_metric_snapshot
           (id,content_id,provider,platform,provider_object_id,fetched_at,metrics_hash,native_metrics)
           VALUES ($1,$2,'meta',$3,$4,$5::timestamptz,$6,$7::jsonb) ON CONFLICT (content_id,metrics_hash) DO NOTHING`,
          [`provider-metric:${digest([content.contentId, nativeMetricsHash])}`, content.contentId, content.platform,
            content.providerObjectId, discovery.fetchedAt, nativeMetricsHash, JSON.stringify(content.nativeMetrics)],
        ),
      ];
    }),
    ...snapshots.map((snapshot) => transaction.query(
      `INSERT INTO ccpun_social.social_metric_snapshot (id,publication_id,provider,platform,platform_object_id,collection_mode,fetched_at,native_metrics,limitations)
       VALUES ($1,$2,$3,$4,$5,'manual-provider-read',$6::timestamptz,$7::jsonb,$8::jsonb) ON CONFLICT (id) DO NOTHING`,
      [snapshotId(snapshot.publicationId, provider, snapshot.fetchedAt), snapshot.publicationId, provider, snapshot.platform, objectIds.get(snapshot.publicationId), snapshot.fetchedAt, JSON.stringify(snapshot.nativeMetrics), JSON.stringify(snapshot.limitations)],
    )),
    transaction.query(
      `INSERT INTO ccpun_social.social_provider_sync_state
       (provider,provider_account_id,cursor,status,last_attempt_at,last_success_at,last_error_category,backfill_completed_at,last_window_start_at)
       VALUES ($1,$2,$3,'connected',$4::timestamptz,$4::timestamptz,NULL,$5::timestamptz,$6::timestamptz)
       ON CONFLICT (provider,provider_account_id) DO UPDATE SET
       cursor=EXCLUDED.cursor,status='connected',last_attempt_at=EXCLUDED.last_attempt_at,last_success_at=EXCLUDED.last_success_at,
       last_error_category=NULL,backfill_completed_at=COALESCE(ccpun_social.social_provider_sync_state.backfill_completed_at,EXCLUDED.backfill_completed_at),
       last_window_start_at=EXCLUDED.last_window_start_at,updated_at=now()`,
      [provider, accountId, cursor, discovery.fetchedAt, provider === "meta" && since === null ? discovery.fetchedAt : syncState?.backfill_completed_at?.toISOString() ?? null, since],
    ),
    transaction.query(
      `INSERT INTO ccpun_social.social_execution_audit (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       VALUES ($1,'human',$2,'analytics:sync','job',$3,$3,'succeeded')`,
      [`audit:${input.requestId}`, safeActorRef(input.actor), input.requestId],
    ),
  ], { isolationLevel: "Serializable" });
  return { discovery, persistence: {
    matchedSnapshots: snapshots.length, providerContentsSeen: providerContents.length,
    syncMode: provider === "meta" ? (since === null ? "full-backfill" as const : "incremental-14-day" as const) : "recent-provider-read" as const,
    syncWindowStart: since, unmatchedProviderObjectIds: matched.unmatchedProviderObjectIds, cursorStored: cursor !== null,
    providerWriteAllowed: false as const, backgroundSyncAllowed: false as const,
  } };
}

export async function recordSocialAnalyticsFailure(input: {
  provider: z.input<typeof socialAnalyticsProviderSchema>; actor: string; requestId: string;
  category: z.input<typeof providerFailureSchema>; env?: Record<string, string | undefined>;
}) {
  const env = input.env ?? process.env;
  const sql = await verifiedSql(env);
  const provider = socialAnalyticsProviderSchema.parse(input.provider);
  const category = providerFailureSchema.parse(input.category);
  const now = new Date().toISOString();
  await sql.transaction((transaction) => [
    transaction.query(`UPDATE ccpun_social.social_provider_sync_state SET status='error',last_attempt_at=$1::timestamptz,last_error_category=$2,updated_at=now() WHERE provider=$3`, [now, category, provider]),
    transaction.query(
      `INSERT INTO ccpun_social.social_execution_audit (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       VALUES ($1,'human',$2,'analytics:sync','job',$3,$3,'failed')`,
      [`audit:${input.requestId}`, safeActorRef(input.actor), input.requestId],
    ),
  ], { isolationLevel: "Serializable" });
}

export async function getSocialAnalyticsDashboard(env: Record<string, string | undefined> = process.env) {
  const sql = await verifiedSql(env);
  const rows = dashboardRowsSchema.parse(await sql.query(
    `SELECT publication_id,provider,platform,platform_object_id,fetched_at,native_metrics,limitations
     FROM ccpun_social.social_metric_snapshot ORDER BY fetched_at DESC LIMIT 400`,
  ));
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) grouped.set(row.publication_id, [...(grouped.get(row.publication_id) ?? []), row]);
  return [...grouped.values()].map((snapshots) => {
    const latest = snapshots[0]!;
    const previous = new Map(snapshots[1]?.native_metrics.map((metric) => [metric.key, metric.value]) ?? []);
    return {
      publicationId: latest.publication_id, provider: latest.provider, platform: latest.platform,
      platformObjectId: latest.platform_object_id, fetchedAt: latest.fetched_at.toISOString(), snapshotCount: snapshots.length,
      metrics: latest.native_metrics.map((metric) => ({ ...metric, delta: previous.has(metric.key) ? metric.value - previous.get(metric.key)! : null })),
      limitation: latest.limitations[0],
    };
  });
}
