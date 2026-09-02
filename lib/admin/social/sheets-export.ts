import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import {
  SOCIAL_PUBLICATION_EXECUTION_MIGRATION_CHECKSUM,
  SOCIAL_PUBLICATION_EXECUTION_MIGRATION_VERSION,
  resolveSocialPublicationRuntime,
} from "./publishing";
import {
  SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
  SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION,
  socialAnalyticsMigrationForLane,
} from "./runtime";
import {
  evaluateGoogleDriveInteractiveAuthorization,
  googleDriveInteractiveAuthorizationSchema,
} from "../media/google-drive-foundation";

if (typeof window !== "undefined") throw new Error("SOCIAL_SHEETS_EXPORT_SERVER_ONLY");

const googleAccessTokenSchema = z.string().trim().min(1).max(8_192)
  .regex(/^[\x21-\x7E]+$/, "Google access token must be one printable header value");

export const socialSheetsExportRequestSchema = z.strictObject({
  accessToken: googleAccessTokenSchema,
  authorization: googleDriveInteractiveAuthorizationSchema,
});

const SOCIAL_MARKETING_MART_P2_VERSION = "20260902_social_marketing_mart_p2_full_backfill_clean";
const SOCIAL_MARKETING_MART_P2_CHECKSUM = "sha256:1dfbe426656ada42fa59f4b0d0727a39c293534abf964690bbbe0d8c6294727f";

type Cell = string | number | boolean;
export type SocialExportSheet = { title: string; rows: Cell[][] };

const metricSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  value: z.number().nonnegative(),
  unit: z.enum(["count", "seconds", "minutes", "milliseconds"]),
  dimension: z.enum(["discovery", "engagement", "deep-engagement", "retention", "business-intent"]),
});

const contentRowsSchema = z.array(z.object({
  record_type: z.enum(["current", "revision"]),
  content_id: z.string(), provider: z.string(), platform: z.string(), provider_account_id: z.string(),
  provider_object_id: z.string(), linked_publication_id: z.string().nullable(), published_at: z.coerce.date(),
  captured_at: z.coerce.date(), text_content: z.string(), media_type: z.string(), permalink_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(), first_seen_at: z.coerce.date(), last_seen_at: z.coerce.date(),
})).max(200_000);

const publicationRowsSchema = z.array(z.object({
  publication_id: z.string(), variant_id: z.string(), master_content_id: z.string(), channel: z.string(),
  format: z.string(), publishing_mode: z.string(), editorial_revision: z.string(), editorial_version: z.coerce.number().int().nullable(),
  status: z.string(), execution_target: z.string().nullable(), scheduled_at: z.coerce.date().nullable(),
  platform_object_id: z.string().nullable(), published_at: z.coerce.date().nullable(), created_at: z.coerce.date(), updated_at: z.coerce.date(),
  job_id: z.string().nullable(), job_type: z.string().nullable(), job_status: z.string().nullable(),
  job_version: z.coerce.number().int().nullable(), attempt_count: z.coerce.number().int().nullable(),
})).max(100_000);

const metricRowsSchema = z.array(z.object({
  source: z.enum(["provider-content", "publication"]), source_id: z.string(), content_id: z.string().nullable(),
  publication_id: z.string().nullable(), provider: z.string(), platform: z.string(), platform_object_id: z.string(),
  fetched_at: z.coerce.date(), native_metrics: z.array(metricSchema).min(1).max(20), limitations: z.array(z.string()).max(10),
})).max(500_000);

const nullableNumber = z.union([z.null(), z.coerce.number()]);
const cleanPostRowsSchema = z.array(z.object({
  content_id: z.string(), publication_id: z.string().nullable(), provider: z.string(), platform: z.string(),
  provider_object_id: z.string(), permalink: z.string().nullable(), thumbnail: z.string().nullable(), text_content: z.string(),
  provider_media_type: z.string(), format_standard: z.string(), published_at_utc: z.coerce.date(),
  published_at_bkk_text: z.string(), publish_date_bkk: z.string(), publish_day_of_week: z.coerce.number().int(),
  publish_hour_bkk: z.coerce.number().int(), snapshot_at: z.coerce.date(), metric_window: z.string(),
  reactions_total: nullableNumber, likes: nullableNumber, comments_total: nullableNumber, shares: nullableNumber,
  saves: nullableNumber, reach: nullableNumber, impressions: nullableNumber, views: nullableNumber, clicks: nullableNumber,
  total_interactions: nullableNumber, reel_total_watch_time_ms: nullableNumber, reel_average_watch_time_ms: nullableNumber,
  known_engagement_rate_by_reach: nullableNumber, known_deep_engagement_rate_by_reach: nullableNumber,
  audience_engagement_rate_by_reach: nullableNumber, audience_deep_engagement_rate_by_reach: nullableNumber,
  known_engagement_total: nullableNumber, known_deep_engagement_total: nullableNumber,
  engagement_components_complete: z.boolean(), comment_attribution_status: z.string(), clicks_per_view: nullableNumber,
  expected_core_metric_count: z.coerce.number().int(), available_core_metric_count: z.coerce.number().int(),
  metric_coverage_rate: nullableNumber, facebook_share_quality_status: z.string().nullable(),
  facebook_share_quality_note: z.string().nullable(), facebook_reaction_definition_status: z.string(),
  instagram_interaction_definition_status: z.string(), data_quality_status: z.string(), analysis_status: z.string(),
})).max(200_000);

const metricCoverageRowsSchema = z.array(z.object({
  provider: z.string(), platform: z.string(), metric_key: z.string(), native_metric_key: z.string().nullable(),
  total_posts: z.coerce.number().int(), eligible_posts: z.coerce.number().int(),
  available_posts: z.coerce.number().int(), not_returned_posts: z.coerce.number().int(),
  not_fetched_posts: z.coerce.number().int(), unsupported_posts: z.coerce.number().int(), not_requested_posts: z.coerce.number().int(),
  permission_denied_posts: z.coerce.number().int(), rate_limited_posts: z.coerce.number().int(),
  fetch_error_posts: z.coerce.number().int(), availability_rate: nullableNumber,
})).max(10_000);

export type SocialSheetsExportData = {
  contents: z.infer<typeof contentRowsSchema>;
  publications: z.infer<typeof publicationRowsSchema>;
  metrics: z.infer<typeof metricRowsSchema>;
  cleanPosts?: z.infer<typeof cleanPostRowsSchema>;
  metricCoverage?: z.infer<typeof metricCoverageRowsSchema>;
};

const platformLabel: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok",
};

function iso(value: Date | null) {
  return value?.toISOString() ?? "";
}

function sheetTitle(value: string, used: Set<string>) {
  const clean = value.replace(/[\\/?*\[\]:]/g, "-").replace(/\s+/g, " ").trim().slice(0, 100) || "Stats";
  let title = clean;
  for (let suffix = 2; used.has(title); suffix += 1) {
    const marker = ` (${suffix})`;
    title = `${clean.slice(0, 100 - marker.length)}${marker}`;
  }
  used.add(title);
  return title;
}

export function buildSocialExportSheets(data: SocialSheetsExportData): SocialExportSheet[] {
  const contents = contentRowsSchema.parse(data.contents);
  const publications = publicationRowsSchema.parse(data.publications);
  const metrics = metricRowsSchema.parse(data.metrics);
  const cleanPosts = cleanPostRowsSchema.parse(data.cleanPosts ?? []);
  const metricCoverage = metricCoverageRowsSchema.parse(data.metricCoverage ?? []);
  const sheets: SocialExportSheet[] = [{
    title: "Content",
    rows: [
      ["record_type", "content_id", "provider", "platform", "provider_account_id", "provider_object_id", "linked_publication_id", "published_at", "captured_at", "text", "media_type", "permalink", "thumbnail", "first_seen_at", "last_seen_at"],
      ...contents.map((row) => [row.record_type, row.content_id, row.provider, row.platform, row.provider_account_id, row.provider_object_id,
        row.linked_publication_id ?? "", iso(row.published_at), iso(row.captured_at), row.text_content, row.media_type,
        row.permalink_url ?? "", row.thumbnail_url ?? "", iso(row.first_seen_at), iso(row.last_seen_at)]),
    ],
  }, {
    title: "Publications",
    rows: [
      ["publication_id", "variant_id", "master_content_id", "platform", "format", "publishing_mode", "editorial_revision", "editorial_version", "status", "execution_target", "scheduled_at", "platform_object_id", "published_at", "created_at", "updated_at", "job_id", "job_type", "job_status", "job_version", "attempt_count"],
      ...publications.map((row) => [row.publication_id, row.variant_id, row.master_content_id, row.channel, row.format,
        row.publishing_mode, row.editorial_revision, row.editorial_version ?? "", row.status, row.execution_target ?? "",
        iso(row.scheduled_at), row.platform_object_id ?? "", iso(row.published_at), iso(row.created_at), iso(row.updated_at),
        row.job_id ?? "", row.job_type ?? "", row.job_status ?? "", row.job_version ?? "", row.attempt_count ?? ""]),
    ],
  }];
  sheets.push({
    title: "Marketing - Posts",
    rows: [
      ["content_id", "publication_id", "provider", "platform", "provider_object_id", "published_at_utc", "published_at_bkk", "publish_date_bkk", "publish_day_of_week", "publish_hour_bkk", "format_standard", "provider_media_type", "text", "permalink", "thumbnail", "snapshot_at", "metric_window", "views", "reach", "clicks", "reactions_total", "likes", "comments_total", "shares", "saves", "total_interactions", "known_engagement_total", "known_deep_engagement_total", "engagement_components_complete", "comment_attribution_status", "known_engagement_rate_by_reach", "known_deep_engagement_rate_by_reach", "audience_engagement_rate_by_reach", "audience_deep_engagement_rate_by_reach", "clicks_per_view", "reel_total_watch_time_ms", "reel_average_watch_time_ms", "available_core_metric_count", "expected_core_metric_count", "metric_coverage_rate", "analysis_status", "data_quality_status", "facebook_share_quality_status", "facebook_reaction_definition_status", "instagram_interaction_definition_status"],
      ...cleanPosts.map((row) => [
        row.content_id, row.publication_id ?? "", row.provider, row.platform, row.provider_object_id, iso(row.published_at_utc),
        row.published_at_bkk_text, row.publish_date_bkk, row.publish_day_of_week, row.publish_hour_bkk, row.format_standard,
        row.provider_media_type, row.text_content, row.permalink ?? "", row.thumbnail ?? "", iso(row.snapshot_at), row.metric_window,
        row.views ?? "", row.reach ?? "", row.clicks ?? "", row.reactions_total ?? "", row.likes ?? "", row.comments_total ?? "",
        row.shares ?? "", row.saves ?? "", row.total_interactions ?? "", row.known_engagement_total ?? "",
        row.known_deep_engagement_total ?? "", row.engagement_components_complete, row.comment_attribution_status,
        row.known_engagement_rate_by_reach ?? "", row.known_deep_engagement_rate_by_reach ?? "",
        row.audience_engagement_rate_by_reach ?? "", row.audience_deep_engagement_rate_by_reach ?? "",
        row.clicks_per_view ?? "", row.reel_total_watch_time_ms ?? "",
        row.reel_average_watch_time_ms ?? "", row.available_core_metric_count, row.expected_core_metric_count,
        row.metric_coverage_rate ?? "", row.analysis_status, row.data_quality_status, row.facebook_share_quality_status ?? "",
        row.facebook_reaction_definition_status, row.instagram_interaction_definition_status,
      ]),
    ],
  }, {
    title: "Marketing - Coverage",
    rows: [
      ["provider", "platform", "metric_key", "native_metric_key", "total_posts", "eligible_posts", "available_posts", "not_returned_posts", "not_fetched_posts", "unsupported_posts", "not_requested_posts", "permission_denied_posts", "rate_limited_posts", "fetch_error_posts", "availability_rate"],
      ...metricCoverage.map((row) => [row.provider, row.platform, row.metric_key, row.native_metric_key ?? "", row.total_posts,
        row.eligible_posts, row.available_posts, row.not_returned_posts, row.not_fetched_posts, row.unsupported_posts,
        row.not_requested_posts, row.permission_denied_posts, row.rate_limited_posts, row.fetch_error_posts, row.availability_rate ?? ""]),
    ],
  }, {
    title: "Marketing - QA",
    rows: [
      ["content_id", "platform", "provider_object_id", "published_at_bkk", "format_standard", "data_quality_status", "facebook_share_quality_status", "facebook_share_quality_note", "facebook_reaction_definition_status", "instagram_interaction_definition_status", "analysis_status", "permalink"],
      ...cleanPosts.filter((row) => row.data_quality_status !== "usable_with_limitations").map((row) => [
        row.content_id, row.platform, row.provider_object_id, row.published_at_bkk_text, row.format_standard, row.data_quality_status,
        row.facebook_share_quality_status ?? "", row.facebook_share_quality_note ?? "", row.facebook_reaction_definition_status,
        row.instagram_interaction_definition_status, row.analysis_status, row.permalink ?? "",
      ]),
    ],
  });
  const families = new Map<string, { platform: string; label: string; rows: Cell[][] }>();
  for (const snapshot of metrics) for (const metric of snapshot.native_metrics) {
    const key = `${snapshot.platform}\u0000${metric.key}`;
    const family = families.get(key) ?? { platform: snapshot.platform, label: metric.label, rows: [] };
    family.rows.push([snapshot.source, snapshot.source_id, snapshot.content_id ?? "", snapshot.publication_id ?? "",
      snapshot.provider, snapshot.platform, snapshot.platform_object_id, iso(snapshot.fetched_at), metric.key, metric.label,
      metric.value, metric.unit, metric.dimension, snapshot.limitations.join(" | ")]);
    families.set(key, family);
  }
  const used = new Set(sheets.map((sheet) => sheet.title));
  for (const family of [...families.values()].sort((a, b) => `${a.platform}:${a.label}`.localeCompare(`${b.platform}:${b.label}`, "en"))) {
    sheets.push({
      title: sheetTitle(`${platformLabel[family.platform] ?? family.platform} - ${family.label}`, used),
      rows: [["source", "source_id", "content_id", "publication_id", "provider", "platform", "platform_object_id", "fetched_at", "metric_key", "metric_label", "value", "unit", "dimension", "limitations"], ...family.rows],
    });
  }
  if (sheets.length > 200) throw new Error("SOCIAL_SHEETS_TOO_MANY_STAT_FAMILIES");
  return sheets;
}

async function verifiedSql(env: Record<string, string | undefined>) {
  const runtime = env.CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1"
    ? resolveSocialPublicationRuntime(env)
    : null;
  if (!runtime) {
    throw new Error("SOCIAL_SHEETS_EXPORT_NOT_CONFIGURED");
  }
  const identity = runtime.neonIdentity;
  const analyticsMigration = socialAnalyticsMigrationForLane(runtime.lane);
  const sql = neon(env.CCPUN_SOCIAL_DATABASE_URL!.trim(), { fetchOptions: { signal: AbortSignal.timeout(30_000) } });
  const rows = await sql.query(
    `SELECT current_database() AS database_name,current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$1 AND checksum=$2) AS analytics_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$3 AND checksum=$4) AS history_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$5 AND checksum=$6) AS publication_current,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$7 AND checksum=$8) AS clean_mart_current,
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$9 AND branch_id=$10
         AND endpoint_id=$11 AND database_name=$12) AS identity_current`,
    [analyticsMigration.version, analyticsMigration.checksum,
      SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION, SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
      SOCIAL_PUBLICATION_EXECUTION_MIGRATION_VERSION, SOCIAL_PUBLICATION_EXECUTION_MIGRATION_CHECKSUM,
      SOCIAL_MARKETING_MART_P2_VERSION, SOCIAL_MARKETING_MART_P2_CHECKSUM,
      identity.projectId, identity.branchId, identity.endpointId, identity.database],
  ) as Array<{ database_name: string; role_name: string; analytics_current: boolean; history_current: boolean; publication_current: boolean; clean_mart_current: boolean; identity_current: boolean }>;
  const row = rows[0];
  if (!row || row.database_name !== identity.database || row.role_name !== identity.role
    || !row.analytics_current || !row.history_current || !row.publication_current || !row.clean_mart_current || !row.identity_current) {
    throw new Error("SOCIAL_SHEETS_EXPORT_IDENTITY_MISMATCH");
  }
  return sql;
}

export async function loadSocialSheetsExportData(env: Record<string, string | undefined> = process.env): Promise<SocialSheetsExportData> {
  const sql = await verifiedSql(env);
  const [contents, publications, providerMetrics, publicationMetrics, cleanPosts, metricCoverage] = await Promise.all([
    sql.query(`SELECT 'current' AS record_type,content.id AS content_id,content.provider,content.platform,content.provider_account_id,
      content.provider_object_id,content.linked_publication_id,content.published_at,content.last_seen_at AS captured_at,
      content.text_content,content.media_type,content.permalink_url,content.thumbnail_url,content.first_seen_at,content.last_seen_at
      FROM ccpun_social.social_provider_content AS content
      UNION ALL
      SELECT 'revision' AS record_type,content.id,content.provider,content.platform,content.provider_account_id,
      content.provider_object_id,content.linked_publication_id,content.published_at,revision.captured_at,
      revision.text_content,revision.media_type,revision.permalink_url,revision.thumbnail_url,content.first_seen_at,content.last_seen_at
      FROM ccpun_social.social_provider_content_revision AS revision
      JOIN ccpun_social.social_provider_content AS content ON content.id=revision.content_id
      ORDER BY published_at DESC,captured_at DESC`),
    sql.query(`SELECT publication.id AS publication_id,publication.variant_id,variant.master_content_id,variant.channel,
      variant.format,variant.publishing_mode,variant.editorial_revision,variant.editorial_version,publication.status,
      publication.execution_target,publication.scheduled_at,publication.platform_object_id,publication.published_at,
      publication.created_at,publication.updated_at,job.id AS job_id,job.job_type,job.status AS job_status,
      job.version AS job_version,job.attempt_count
      FROM ccpun_social.social_publication AS publication
      JOIN ccpun_social.social_variant_link AS variant ON variant.variant_id=publication.variant_id
      LEFT JOIN ccpun_social.social_publication_job AS job ON job.publication_id=publication.id
      ORDER BY publication.created_at DESC,job.created_at DESC`),
    sql.query(`SELECT 'provider-content' AS source,snapshot.id AS source_id,snapshot.content_id,NULL::text AS publication_id,
      snapshot.provider,snapshot.platform,snapshot.provider_object_id AS platform_object_id,snapshot.fetched_at,
      snapshot.native_metrics,'[]'::jsonb AS limitations
      FROM ccpun_social.social_provider_metric_snapshot AS snapshot ORDER BY snapshot.fetched_at DESC`),
    sql.query(`SELECT 'publication' AS source,snapshot.id AS source_id,NULL::text AS content_id,snapshot.publication_id,
      snapshot.provider,snapshot.platform,snapshot.platform_object_id,snapshot.fetched_at,snapshot.native_metrics,snapshot.limitations
      FROM ccpun_social.social_metric_snapshot AS snapshot ORDER BY snapshot.fetched_at DESC`),
    sql.query(`SELECT content_id,publication_id,provider,platform,provider_object_id,permalink,thumbnail,text_content,
      provider_media_type,format_standard,published_at_utc,to_char(published_at_bkk,'YYYY-MM-DD HH24:MI:SS') AS published_at_bkk_text,
      publish_date_bkk::text,publish_day_of_week,publish_hour_bkk,snapshot_at,metric_window,reactions_total,likes,comments_total,
      shares,saves,reach,impressions,views,clicks,total_interactions,reel_total_watch_time_ms,reel_average_watch_time_ms,
      known_engagement_rate_by_reach,known_deep_engagement_rate_by_reach,
      audience_engagement_rate_by_reach,audience_deep_engagement_rate_by_reach,
      known_engagement_total,known_deep_engagement_total,engagement_components_complete,comment_attribution_status,
      clicks_per_view,expected_core_metric_count,available_core_metric_count,metric_coverage_rate,
      facebook_share_quality_status,facebook_share_quality_note,facebook_reaction_definition_status,
      instagram_interaction_definition_status,data_quality_status,analysis_status
      FROM ccpun_social.post_performance_clean ORDER BY published_at_utc DESC`),
    sql.query(`SELECT provider,platform,metric_key,native_metric_key,total_posts,eligible_posts,available_posts,not_returned_posts,
      not_fetched_posts,unsupported_posts,not_requested_posts,permission_denied_posts,rate_limited_posts,fetch_error_posts,availability_rate
      FROM ccpun_social.post_metric_coverage_summary ORDER BY platform,metric_key`),
  ]);
  return {
    contents: contentRowsSchema.parse(contents),
    publications: publicationRowsSchema.parse(publications),
    metrics: metricRowsSchema.parse([...providerMetrics, ...publicationMetrics]),
    cleanPosts: cleanPostRowsSchema.parse(cleanPosts),
    metricCoverage: metricCoverageRowsSchema.parse(metricCoverage),
  };
}

export class SocialSheetsExportError extends Error {
  constructor(message: string, readonly spreadsheetUrl: string | null = null) { super(message); }
}

function googleError(status: number, spreadsheetUrl: string | null) {
  if (status === 401 || status === 403) return new SocialSheetsExportError("GOOGLE_SHEETS_AUTH_REQUIRED", spreadsheetUrl);
  if (status === 429) return new SocialSheetsExportError("GOOGLE_SHEETS_RATE_LIMITED", spreadsheetUrl);
  return new SocialSheetsExportError("GOOGLE_SHEETS_UNAVAILABLE", spreadsheetUrl);
}

function rowChunks(rows: Cell[][], maxBytes = 1_500_000) {
  const chunks: Cell[][][] = [];
  let chunk: Cell[][] = [];
  let bytes = 0;
  for (const row of rows) {
    const size = Buffer.byteLength(JSON.stringify(row), "utf8") + 1;
    if (chunk.length && bytes + size > maxBytes) { chunks.push(chunk); chunk = []; bytes = 0; }
    chunk.push(row); bytes += size;
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}

export async function createSocialGoogleSpreadsheet(input: {
  accessToken: string; authorization: unknown; sheets: SocialExportSheet[]; nowMs?: number; fetcher?: typeof fetch;
}) {
  const parsed = socialSheetsExportRequestSchema.parse({ accessToken: input.accessToken, authorization: input.authorization });
  if (!evaluateGoogleDriveInteractiveAuthorization(parsed.authorization, input.nowMs ?? Date.now()).usable) {
    throw new SocialSheetsExportError("GOOGLE_SHEETS_AUTH_REQUIRED");
  }
  if (input.sheets.length < 2 || input.sheets.length > 200) throw new SocialSheetsExportError("GOOGLE_SHEETS_INVALID_EXPORT");
  const fetcher = input.fetcher ?? fetch;
  const created = await fetcher("https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheetId", {
    method: "POST",
    headers: { Authorization: `Bearer ${parsed.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { title: `CCPun Social Export ${new Date(input.nowMs ?? Date.now()).toISOString().slice(0, 10)}` },
      sheets: input.sheets.map((sheet) => ({ properties: { title: sheet.title } })),
    }),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!created.ok) {
    await created.body?.cancel().catch(() => undefined);
    throw googleError(created.status, null);
  }
  const payload = await created.json().catch(() => null) as { spreadsheetId?: unknown } | null;
  const spreadsheetId = typeof payload?.spreadsheetId === "string" && /^[A-Za-z0-9_-]{10,200}$/.test(payload.spreadsheetId)
    ? payload.spreadsheetId : null;
  if (!spreadsheetId) throw new SocialSheetsExportError("GOOGLE_SHEETS_INVALID_RESPONSE");
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  for (const sheet of input.sheets) {
    let startRow = 1;
    for (const rows of rowChunks(sheet.rows)) {
      const range = encodeURIComponent(`'${sheet.title.replaceAll("'", "''")}'!A${startRow}`);
      const response = await fetcher(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${parsed.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ range: `'${sheet.title.replaceAll("'", "''")}'!A${startRow}`, majorDimension: "ROWS", values: rows }),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw googleError(response.status, spreadsheetUrl);
      }
      await response.body?.cancel().catch(() => undefined);
      startRow += rows.length;
    }
  }
  return { spreadsheetId, spreadsheetUrl, sheets: input.sheets.map((sheet) => ({ title: sheet.title, rows: Math.max(0, sheet.rows.length - 1) })) };
}

export async function exportSocialDataToGoogleSheets(input: {
  accessToken: string; authorization: unknown; env?: Record<string, string | undefined>; fetcher?: typeof fetch; nowMs?: number;
}) {
  const data = await loadSocialSheetsExportData(input.env ?? process.env);
  return createSocialGoogleSpreadsheet({
    accessToken: input.accessToken,
    authorization: input.authorization,
    sheets: buildSocialExportSheets(data),
    fetcher: input.fetcher,
    nowMs: input.nowMs,
  });
}
