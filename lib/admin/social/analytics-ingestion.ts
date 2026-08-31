import "server-only";

import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { CCPUN_VERCEL_PROJECT_IDS, parseAdminEnvironment } from "../environment";
import { WEBSITE_42_SANITY_DATASET, WEBSITE_42_SANITY_PROJECT_ID } from "./foundation";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH } from "./provider-readonly";
import { fetchMetaReadOnlyDiscovery, matchMetaHistoricalAnalytics } from "./providers/meta/read-only";
import { fetchTikTokReadOnlyDiscovery, matchTikTokHistoricalAnalytics } from "./providers/tiktok/read-only";
import { fetchYouTubeReadOnlyDiscovery, matchYouTubeHistoricalAnalytics } from "./providers/youtube/read-only";

export const SOCIAL_ANALYTICS_MIGRATION_VERSION = "20260831_website_42_social_analytics_ingestion";
export const SOCIAL_ANALYTICS_MIGRATION_CHECKSUM = "sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c";
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

async function verifiedSql(env: Record<string, string | undefined>) {
  if (!isSocialAnalyticsIngestionEnabled(env)) throw new Error("SOCIAL_ANALYTICS_NOT_CONFIGURED");
  const sql = neon(env.CCPUN_SOCIAL_DATABASE_URL!.trim(), { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
  const rows = await sql.query(
    `SELECT current_database() AS database_name, current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$1 AND checksum=$2) AS ledger_current,
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$3 AND branch_id=$4
         AND endpoint_id=$5 AND database_name=$6 AND migration_version=$1 AND migration_checksum=$2) AS identity_current`,
    [SOCIAL_ANALYTICS_MIGRATION_VERSION, SOCIAL_ANALYTICS_MIGRATION_CHECKSUM, UAT_NEON.projectId, UAT_NEON.branchId, UAT_NEON.endpointId, UAT_NEON.database],
  ) as Array<{ database_name: string; role_name: string; ledger_current: boolean; identity_current: boolean }>;
  const row = rows[0];
  if (!row || row.database_name !== UAT_NEON.database || row.role_name !== UAT_NEON.role || !row.ledger_current || !row.identity_current) throw new Error("SOCIAL_ANALYTICS_IDENTITY_MISMATCH");
  return sql;
}

async function fetchProvider(provider: z.infer<typeof socialAnalyticsProviderSchema>, publications: z.infer<typeof publicationsSchema>, env: Record<string, string | undefined>, fetcher: typeof fetch) {
  const refs = publications.map((item) => ({ publicationId: item.publication_id, platform: item.platform, platformObjectId: item.platform_object_id }));
  if (provider === "meta") {
    const discovery = await fetchMetaReadOnlyDiscovery(env, fetcher);
    if (!discovery.selectedPageId) throw new Error("META_PAGE_SELECTION_REQUIRED");
    return { discovery, matched: matchMetaHistoricalAnalytics(refs, discovery), accountId: discovery.selectedPageId, cursor: null };
  }
  if (provider === "youtube") {
    const discovery = await fetchYouTubeReadOnlyDiscovery(env, fetcher);
    return { discovery, matched: matchYouTubeHistoricalAnalytics(refs, discovery), accountId: discovery.channel.id, cursor: null };
  }
  const discovery = await fetchTikTokReadOnlyDiscovery(env, fetcher);
  return { discovery, matched: matchTikTokHistoricalAnalytics(refs, discovery), accountId: discovery.profile.openId, cursor: discovery.nextCursor === null ? null : String(discovery.nextCursor) };
}

export async function syncSocialHistoricalAnalytics(input: {
  provider: z.input<typeof socialAnalyticsProviderSchema>; actor: string; requestId: string;
  env?: Record<string, string | undefined>; fetcher?: typeof fetch;
}) {
  const provider = socialAnalyticsProviderSchema.parse(input.provider);
  const env = input.env ?? process.env;
  const sql = await verifiedSql(env);
  const publications = publicationsSchema.parse(await sql.query(
    `SELECT publication.id AS publication_id, variant.channel AS platform, publication.platform_object_id, publication.published_at
     FROM ccpun_social.social_publication AS publication JOIN ccpun_social.social_variant_link AS variant ON variant.variant_id=publication.variant_id
     WHERE publication.status='published' AND variant.channel IN ('facebook','instagram','youtube','tiktok') AND publication.platform_object_id IS NOT NULL`,
  ));
  const platforms = provider === "meta" ? new Set(["facebook", "instagram"]) : new Set([provider]);
  const relevant = publications.filter((publication) => platforms.has(publication.platform));
  const { discovery, matched, accountId, cursor } = await fetchProvider(provider, relevant, env, input.fetcher ?? fetch);
  const publishedAt = new Map(relevant.map((publication) => [publication.publication_id, publication.published_at.getTime()]));
  const objectIds = new Map(relevant.map((publication) => [publication.publication_id, publication.platform_object_id]));
  const snapshots = matched.snapshots.filter((snapshot) => Date.parse(snapshot.fetchedAt) >= (publishedAt.get(snapshot.publicationId) ?? Number.POSITIVE_INFINITY));

  await sql.transaction((transaction) => [
    ...snapshots.map((snapshot) => transaction.query(
      `INSERT INTO ccpun_social.social_metric_snapshot (id,publication_id,provider,platform,platform_object_id,collection_mode,fetched_at,native_metrics,limitations)
       VALUES ($1,$2,$3,$4,$5,'manual-provider-read',$6::timestamptz,$7::jsonb,$8::jsonb) ON CONFLICT (id) DO NOTHING`,
      [snapshotId(snapshot.publicationId, provider, snapshot.fetchedAt), snapshot.publicationId, provider, snapshot.platform, objectIds.get(snapshot.publicationId), snapshot.fetchedAt, JSON.stringify(snapshot.nativeMetrics), JSON.stringify(snapshot.limitations)],
    )),
    transaction.query(
      `INSERT INTO ccpun_social.social_provider_sync_state (provider,provider_account_id,cursor,status,last_attempt_at,last_success_at,last_error_category)
       VALUES ($1,$2,$3,'connected',$4::timestamptz,$4::timestamptz,NULL) ON CONFLICT (provider,provider_account_id) DO UPDATE SET
       cursor=EXCLUDED.cursor,status='connected',last_attempt_at=EXCLUDED.last_attempt_at,last_success_at=EXCLUDED.last_success_at,last_error_category=NULL,updated_at=now()`,
      [provider, accountId, cursor, discovery.fetchedAt],
    ),
    transaction.query(
      `INSERT INTO ccpun_social.social_execution_audit (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       VALUES ($1,'human',$2,'analytics:sync','job',$3,$3,'succeeded')`,
      [`audit:${input.requestId}`, safeActorRef(input.actor), input.requestId],
    ),
  ], { isolationLevel: "Serializable" });
  return { discovery, persistence: { matchedSnapshots: snapshots.length, unmatchedProviderObjectIds: matched.unmatchedProviderObjectIds, cursorStored: cursor !== null, providerWriteAllowed: false as const, backgroundSyncAllowed: false as const } };
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
