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

type Cell = string | number | boolean;
export type SocialExportSheet = { title: string; rows: Cell[][] };

const metricSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  value: z.number().nonnegative(),
  unit: z.enum(["count", "seconds", "minutes"]),
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

export type SocialSheetsExportData = {
  contents: z.infer<typeof contentRowsSchema>;
  publications: z.infer<typeof publicationRowsSchema>;
  metrics: z.infer<typeof metricRowsSchema>;
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
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$7 AND branch_id=$8
         AND endpoint_id=$9 AND database_name=$10) AS identity_current`,
    [analyticsMigration.version, analyticsMigration.checksum,
      SOCIAL_PROVIDER_HISTORY_MIGRATION_VERSION, SOCIAL_PROVIDER_HISTORY_MIGRATION_CHECKSUM,
      SOCIAL_PUBLICATION_EXECUTION_MIGRATION_VERSION, SOCIAL_PUBLICATION_EXECUTION_MIGRATION_CHECKSUM,
      identity.projectId, identity.branchId, identity.endpointId, identity.database],
  ) as Array<{ database_name: string; role_name: string; analytics_current: boolean; history_current: boolean; publication_current: boolean; identity_current: boolean }>;
  const row = rows[0];
  if (!row || row.database_name !== identity.database || row.role_name !== identity.role
    || !row.analytics_current || !row.history_current || !row.publication_current || !row.identity_current) {
    throw new Error("SOCIAL_SHEETS_EXPORT_IDENTITY_MISMATCH");
  }
  return sql;
}

export async function loadSocialSheetsExportData(env: Record<string, string | undefined> = process.env): Promise<SocialSheetsExportData> {
  const sql = await verifiedSql(env);
  const [contents, publications, providerMetrics, publicationMetrics] = await Promise.all([
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
  ]);
  return {
    contents: contentRowsSchema.parse(contents),
    publications: publicationRowsSchema.parse(publications),
    metrics: metricRowsSchema.parse([...providerMetrics, ...publicationMetrics]),
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
