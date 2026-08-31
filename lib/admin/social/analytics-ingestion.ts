import "server-only";

import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { CCPUN_VERCEL_PROJECT_IDS, parseAdminEnvironment } from "../environment";
import { WEBSITE_42_SANITY_DATASET, WEBSITE_42_SANITY_PROJECT_ID } from "./foundation";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH } from "./provider-readonly";
import { fetchTikTokReadOnlyDiscovery, matchTikTokHistoricalAnalytics } from "./providers/tiktok/read-only";

export const SOCIAL_ANALYTICS_MIGRATION_VERSION = "20260831_website_42_social_analytics_ingestion";
export const SOCIAL_ANALYTICS_MIGRATION_CHECKSUM = "sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c";

const UAT_NEON = {
  projectId: "young-term-47483330",
  branchId: "br-crimson-mouse-az7ajkv8",
  endpointId: "ep-mute-frost-aztvz394",
  database: "neondb",
  role: "ccpun_social_runtime",
} as const;
const providerFailureSchema = z.enum(["authentication", "authorization", "rate-limit", "timeout", "provider-unavailable", "invalid-response", "unknown"]);
const publicationsSchema = z.array(z.object({
  publication_id: z.string().trim().min(1).max(120),
  platform: z.literal("tiktok"),
  platform_object_id: z.string().trim().min(1).max(200),
  published_at: z.coerce.date(),
})).max(10_000);

function isExactUatConnectionString(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname;
    return url.protocol === "postgresql:"
      && decodeURIComponent(url.username) === UAT_NEON.role
      && Boolean(url.password)
      && decodeURIComponent(url.pathname.slice(1)) === UAT_NEON.database
      && [
        `${UAT_NEON.endpointId}.c-3.ap-southeast-1.aws.neon.tech`,
        `${UAT_NEON.endpointId}-pooler.c-3.ap-southeast-1.aws.neon.tech`,
      ].includes(hostname);
  } catch {
    return false;
  }
}

export function isSocialAnalyticsIngestionEnabled(env: Record<string, string | undefined> = process.env) {
  const projectId = env.VERCEL_PROJECT_ID?.trim() || env.NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID?.trim();
  return env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1"
    && parseAdminEnvironment(env.CCPUN_APP_ENV) === "admin-uat"
    && projectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction
    && env.VERCEL_GIT_COMMIT_REF?.trim() === WEBSITE_42_SOCIAL_ANALYTICS_BRANCH
    && env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() === WEBSITE_42_SANITY_PROJECT_ID
    && env.NEXT_PUBLIC_SANITY_DATASET?.trim() === WEBSITE_42_SANITY_DATASET
    && env.CCPUN_NEON_PROJECT_ID?.trim() === UAT_NEON.projectId
    && env.CCPUN_NEON_BRANCH_ID?.trim() === UAT_NEON.branchId
    && env.CCPUN_NEON_ENDPOINT_ID?.trim() === UAT_NEON.endpointId
    && env.CCPUN_NEON_DATABASE?.trim() === UAT_NEON.database
    && isExactUatConnectionString(env.CCPUN_SOCIAL_DATABASE_URL?.trim());
}

export function getSocialAnalyticsIngestionRuntimeStatus(env: Record<string, string | undefined> = process.env) {
  return {
    enabled: isSocialAnalyticsIngestionEnabled(env),
    mode: "manual-provider-read" as const,
    providerWriteAllowed: false as const,
    backgroundSyncAllowed: false as const,
  };
}

function safeActorRef(actor: string) {
  return `admin:${createHash("sha256").update(actor).digest("hex").slice(0, 32)}`;
}

function snapshotId(publicationId: string, fetchedAt: string) {
  return `metric:${createHash("sha256").update(`${publicationId}:tiktok:${fetchedAt}`).digest("hex")}`;
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
  if (!row || row.database_name !== UAT_NEON.database || row.role_name !== UAT_NEON.role || !row.ledger_current || !row.identity_current) {
    throw new Error("SOCIAL_ANALYTICS_IDENTITY_MISMATCH");
  }
  return sql;
}

export async function syncTikTokHistoricalAnalytics(input: {
  actor: string;
  requestId: string;
  env?: Record<string, string | undefined>;
  fetcher?: typeof fetch;
}) {
  const env = input.env ?? process.env;
  const sql = await verifiedSql(env);
  const publications = publicationsSchema.parse(await sql.query(
    `SELECT publication.id AS publication_id, variant.channel AS platform,
       publication.platform_object_id, publication.published_at
     FROM ccpun_social.social_publication AS publication
     JOIN ccpun_social.social_variant_link AS variant ON variant.variant_id=publication.variant_id
     WHERE publication.status='published' AND variant.channel='tiktok' AND publication.platform_object_id IS NOT NULL`,
  ));
  const discovery = await fetchTikTokReadOnlyDiscovery(env, input.fetcher ?? fetch);
  const matched = matchTikTokHistoricalAnalytics(publications.map((publication) => ({
    publicationId: publication.publication_id,
    platform: publication.platform,
    platformObjectId: publication.platform_object_id,
  })), discovery);
  const publishedAtById = new Map(publications.map((publication) => [publication.publication_id, publication.published_at.getTime()]));
  const snapshots = matched.snapshots.filter((snapshot) => Date.parse(snapshot.fetchedAt) >= (publishedAtById.get(snapshot.publicationId) ?? Number.POSITIVE_INFINITY));
  const objectIdByPublication = new Map(publications.map((publication) => [publication.publication_id, publication.platform_object_id]));
  const actorRef = safeActorRef(input.actor);
  const cursor = discovery.nextCursor === null ? null : String(discovery.nextCursor);

  await sql.transaction((transaction) => [
    ...snapshots.map((snapshot) => transaction.query(
      `INSERT INTO ccpun_social.social_metric_snapshot
        (id,publication_id,provider,platform,platform_object_id,collection_mode,fetched_at,native_metrics,limitations)
       VALUES ($1,$2,'tiktok','tiktok',$3,'manual-provider-read',$4::timestamptz,$5::jsonb,$6::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [snapshotId(snapshot.publicationId, snapshot.fetchedAt), snapshot.publicationId, objectIdByPublication.get(snapshot.publicationId), snapshot.fetchedAt, JSON.stringify(snapshot.nativeMetrics), JSON.stringify(snapshot.limitations)],
    )),
    transaction.query(
      `INSERT INTO ccpun_social.social_provider_sync_state
        (provider,provider_account_id,cursor,status,last_attempt_at,last_success_at,last_error_category)
       VALUES ('tiktok',$1,$2,'connected',$3::timestamptz,$3::timestamptz,NULL)
       ON CONFLICT (provider,provider_account_id) DO UPDATE SET
        cursor=EXCLUDED.cursor,status='connected',last_attempt_at=EXCLUDED.last_attempt_at,
        last_success_at=EXCLUDED.last_success_at,last_error_category=NULL,updated_at=now()`,
      [discovery.profile.openId, cursor, discovery.fetchedAt],
    ),
    transaction.query(
      `INSERT INTO ccpun_social.social_execution_audit
        (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       VALUES ($1,'human',$2,'analytics:sync','job',$3,$3,'succeeded')`,
      [`audit:${input.requestId}`, actorRef, input.requestId],
    ),
  ], { isolationLevel: "Serializable" });

  return {
    discovery,
    persistence: {
      matchedSnapshots: snapshots.length,
      unmatchedProviderObjectIds: matched.unmatchedProviderObjectIds,
      cursorStored: cursor !== null,
      providerWriteAllowed: false as const,
      backgroundSyncAllowed: false as const,
    },
  };
}

export async function recordTikTokAnalyticsFailure(input: {
  actor: string;
  requestId: string;
  category: z.input<typeof providerFailureSchema>;
  env?: Record<string, string | undefined>;
}) {
  const env = input.env ?? process.env;
  const sql = await verifiedSql(env);
  const category = providerFailureSchema.parse(input.category);
  const now = new Date().toISOString();
  await sql.transaction((transaction) => [
    transaction.query(
      `UPDATE ccpun_social.social_provider_sync_state SET
        status='error',last_attempt_at=$1::timestamptz,last_error_category=$2,updated_at=now()
       WHERE provider='tiktok'`,
      [now, category],
    ),
    transaction.query(
      `INSERT INTO ccpun_social.social_execution_audit
        (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       VALUES ($1,'human',$2,'analytics:sync','job',$3,$3,'failed')`,
      [`audit:${input.requestId}`, safeActorRef(input.actor), input.requestId],
    ),
  ], { isolationLevel: "Serializable" });
}
