import { createHash } from "node:crypto";
import { createClient } from "@sanity/client";
import { neon } from "@neondatabase/serverless";
import { sanitizeLegacyAuditPayload } from "../lib/admin/operations/backfill";
import { ADMIN_OPERATIONS_MIGRATION_CHECKSUM, ADMIN_OPERATIONS_MIGRATION_VERSION } from "../lib/admin/operations/foundation";

const SOURCE = { projectId: "ccb9lnw5", dataset: "uat" } as const;
const TARGET = { projectId: "young-term-47483330", branchId: "br-crimson-mouse-az7ajkv8", endpointId: "ep-mute-frost-aztvz394", database: "neondb" } as const;
const CURRENT_INVENTORY_BASELINE = { auditLog: 43, researchSnapshot: 2, seoSuggestion: 19 } as const;
const apply = process.argv.includes("--apply");
const enforceCurrentInventory = process.argv.includes("--expect-current-inventory");

type SourceDocument = Record<string, unknown> & { _id: string; _rev: string; _type: keyof typeof CURRENT_INVENTORY_BASELINE };

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown) { return createHash("sha256").update(canonical(value)).digest("hex"); }
function text(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function array(value: unknown) { return Array.isArray(value) ? value : []; }
function uuid(value: unknown, seed: string) {
  if (typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return value;
  const digest = hash(seed);
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
}

function sourceHash(document: SourceDocument) {
  const { _rev, _createdAt, _updatedAt, ...payload } = document;
  void _rev; void _createdAt; void _updatedAt;
  return hash(payload);
}

async function main() {
  const token = process.env.SANITY_API_READ_TOKEN?.trim();
  if (!token) throw new Error("SANITY_API_READ_TOKEN is required; no write-token fallback is allowed");
  const sanityProject = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || SOURCE.projectId;
  const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || SOURCE.dataset;
  if (sanityProject !== SOURCE.projectId || sanityDataset !== SOURCE.dataset) throw new Error("Source must be ccb9lnw5/uat");

  const sanity = createClient({ projectId: SOURCE.projectId, dataset: SOURCE.dataset, token, apiVersion: "2026-08-20", useCdn: false, perspective: "raw" });
  const documents = await sanity.fetch<SourceDocument[]>(
    `*[_type in ["auditLog","researchSnapshot","seoSuggestion"]] | order(_type asc, _id asc)`,
  );
  const counts = Object.fromEntries(Object.keys(CURRENT_INVENTORY_BASELINE).map((type) => [type, documents.filter((doc) => doc._type === type).length]));
  const baselineMatches = Object.entries(CURRENT_INVENTORY_BASELINE).every(([type, expected]) => counts[type] === expected);
  if ((apply || enforceCurrentInventory) && !baselineMatches) {
    throw new Error(`Source inventory differs from the 2026-08-30 baseline: ${JSON.stringify(counts)}`);
  }
  const sourceDigest = hash(documents.map((document) => `${document._type}:${document._id}:${document._rev}:${sourceHash(document)}`));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", source: SOURCE, target: TARGET, counts,
    currentInventoryBaseline: CURRENT_INVENTORY_BASELINE, baselineMatches, sourceDigest }, null, 2));
  if (!apply) return;

  if (process.env.CCPUN_APP_ENV !== "local-uat") throw new Error("--apply requires CCPUN_APP_ENV=local-uat");
  if (process.env.CCPUN_NEON_PROJECT_ID !== TARGET.projectId || process.env.CCPUN_NEON_BRANCH_ID !== TARGET.branchId || process.env.CCPUN_NEON_DATABASE !== TARGET.database) {
    throw new Error("Neon identity mismatch; expected existing UAT project/branch/database");
  }
  const connectionString = process.env.CCPUN_ADMIN_BACKFILL_DATABASE_URL?.trim();
  if (!connectionString) throw new Error("CCPUN_ADMIN_BACKFILL_DATABASE_URL is required");
  const connectionUrl = new URL(connectionString);
  const endpointHosts = new Set([`${TARGET.endpointId}.ap-southeast-1.aws.neon.tech`, `${TARGET.endpointId}-pooler.ap-southeast-1.aws.neon.tech`]);
  if (connectionUrl.protocol !== "postgresql:" || !endpointHosts.has(connectionUrl.hostname)) throw new Error("Backfill URL must use the exact UAT Neon endpoint");
  if (decodeURIComponent(connectionUrl.pathname.slice(1)) !== TARGET.database) throw new Error("Backfill URL database mismatch");
  if (!["neondb_owner", "cloud_admin"].includes(decodeURIComponent(connectionUrl.username))) {
    throw new Error("Backfill requires an owner role and refuses ccpun_admin_runtime");
  }
  const sql = neon(connectionString, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
  const identity = await sql.query(
    `SELECT current_database() AS database_name,current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_admin.schema_migration WHERE version=$1 AND checksum=$2) AS ledger_current,
       EXISTS (SELECT 1 FROM ccpun_admin.system_identity WHERE singleton=true AND project_id=$3 AND branch_id=$4
         AND endpoint_id=$5 AND database_name=$6 AND migration_version=$1 AND migration_checksum=$2) AS identity_current`,
    [ADMIN_OPERATIONS_MIGRATION_VERSION,ADMIN_OPERATIONS_MIGRATION_CHECKSUM,TARGET.projectId,TARGET.branchId,TARGET.endpointId,TARGET.database],
  ) as Array<{ database_name: string; role_name: string; ledger_current: boolean; identity_current: boolean }>;
  const identityRow = identity[0];
  if (!identityRow || identityRow.database_name !== TARGET.database || !["neondb_owner","cloud_admin"].includes(identityRow.role_name)
    || !identityRow.ledger_current || !identityRow.identity_current) throw new Error("Neon migration identity/checksum mismatch");

  for (const document of documents) {
    const payloadHash = sourceHash(document);
    const source = [SOURCE.projectId, SOURCE.dataset, document._id, document._rev, payloadHash];
    if (document._type === "auditLog") {
      await sql.query(
        `INSERT INTO ccpun_admin.audit_log
          (id,actor,actor_type,action,object_type,object_id,before_json,after_json,request_id,environment,occurred_at,
           source_project_id,source_dataset,source_document_id,source_revision,source_hash_sha256)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::uuid,$10,$11::timestamptz,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET id=EXCLUDED.id
         WHERE ccpun_admin.audit_log.source_hash_sha256=EXCLUDED.source_hash_sha256
         RETURNING source_hash_sha256`,
        [document._id, text(document.actor,"legacy-system"), ["human","ai","system"].includes(text(document.actorType)) ? document.actorType : "system",
          text(document.action,"legacy:unknown").toLowerCase().replace(/[^a-z0-9:-]/g,"-").slice(0,100), text(document.objectType,"unknown"),
          text(document.objectId,document._id), JSON.stringify(sanitizeLegacyAuditPayload(document.before)), JSON.stringify(sanitizeLegacyAuditPayload(document.after)),
          uuid(document.requestId,document._id), text(document.environment,"admin-uat"), text(document.timestamp,text(document._updatedAt,new Date(0).toISOString())), ...source],
      ).then((rows) => { if (!(rows as unknown[])[0]) throw new Error(`Hash conflict: ${document._id}`); });
    } else if (document._type === "researchSnapshot") {
      await sql.query(
        `INSERT INTO ccpun_admin.research_snapshot
          (id,keyword,keyword_key,provider,scope,location,language,volume,difficulty,intent,serp_json,competitors_json,trust_class,checked_at,
           source_project_id,source_dataset,source_document_id,source_revision,source_hash_sha256)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14::timestamptz,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET id=EXCLUDED.id
         WHERE ccpun_admin.research_snapshot.source_hash_sha256=EXCLUDED.source_hash_sha256
         RETURNING source_hash_sha256`,
        [document._id,text(document.keyword),text(document.keywordKey,text(document.keyword).toLocaleLowerCase("th-TH").trim()),text(document.provider,"manual"),
          document.scope ?? null,document.location ?? null,document.language ?? null,number(document.volume),number(document.difficulty),document.intent ?? null,
          JSON.stringify(array(document.serp)),JSON.stringify(array(document.competitors)),text(document.trustClass,"untrusted-external-data"),
          text(document.checkedAt,text(document._updatedAt,new Date(0).toISOString())),...source],
      ).then((rows) => { if (!(rows as unknown[])[0]) throw new Error(`Hash conflict: ${document._id}`); });
    } else {
      const target = document.targetDocument as { _ref?: unknown } | undefined;
      await sql.query(
        `INSERT INTO ccpun_admin.seo_suggestion
          (id,target_document_id,target_revision,suggestion_type,before_value,after_value,reason,confidence,risk_level,evidence_json,status,
           created_by,created_at,edited_by,edited_at,reviewed_by,reviewed_at,rejection_reason,approved_after,approved_base_value,approved_type,
           approved_risk_level,approved_target_id,approved_target_revision,applied_by,applied_at,row_version,apply_request_id,apply_state,
           source_project_id,source_dataset,source_document_id,source_revision,source_hash_sha256)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13::timestamptz,$14,$15::timestamptz,$16,$17::timestamptz,$18,$19,$20,$21,$22,$23,$24,$25,$26::timestamptz,1,$27::uuid,$28,$29,$30,$31,$32,$33)
         ON CONFLICT (id) DO UPDATE SET id=EXCLUDED.id
         WHERE ccpun_admin.seo_suggestion.source_hash_sha256=EXCLUDED.source_hash_sha256
         RETURNING source_hash_sha256`,
        [document._id,text(target?._ref).replace(/^drafts\./,""),text(document.targetRevision,"legacy-unknown"),text(document.type,"content"),
          document.before ?? null,text(document.after,"legacy-value"),text(document.reason,"Legacy migrated suggestion"),number(document.confidence) ?? 0,
          text(document.riskLevel,"critical"),JSON.stringify(array(document.evidence)),text(document.status,"needs-human-review"),text(document.createdBy,"legacy-system"),
          text(document.createdAt,text(document._createdAt,new Date(0).toISOString())),document.editedBy ?? null,document.editedAt ?? null,document.reviewedBy ?? null,
          document.reviewedAt ?? null,document.rejectionReason ?? null,document.approvedAfter ?? null,document.approvedBaseValue ?? null,document.approvedType ?? null,
          document.approvedRiskLevel ?? null,document.approvedTargetId ?? null,document.approvedTargetRevision ?? null,document.appliedBy ?? null,document.appliedAt ?? null,
          text(document.status) === "applied" ? uuid(null,`${document._id}:legacy-applied`) : null,
          text(document.status) === "applied" ? "completed" : null,...source],
      ).then((rows) => { if (!(rows as unknown[])[0]) throw new Error(`Hash conflict: ${document._id}`); });
    }
  }

  const postflight = await sql.query(
    `SELECT 'auditLog' AS type,count(*)::int AS count FROM ccpun_admin.audit_log WHERE source_project_id=$1 AND source_dataset=$2
     UNION ALL SELECT 'researchSnapshot',count(*)::int FROM ccpun_admin.research_snapshot WHERE source_project_id=$1 AND source_dataset=$2
     UNION ALL SELECT 'seoSuggestion',count(*)::int FROM ccpun_admin.seo_suggestion WHERE source_project_id=$1 AND source_dataset=$2`,
    [SOURCE.projectId,SOURCE.dataset],
  ) as Array<{ type: string; count: number }>;
  const targetCounts = Object.fromEntries(postflight.map((row) => [row.type, row.count]));
  for (const [type, sourceCount] of Object.entries(counts)) if (targetCounts[type] !== sourceCount) throw new Error(`Postflight count mismatch for ${type}`);
  const targetLineage = await sql.query(
    `SELECT type,source_document_id,source_revision,source_hash_sha256 FROM (
       SELECT 'auditLog'::text AS type,source_document_id,source_revision,source_hash_sha256 FROM ccpun_admin.audit_log
       WHERE source_project_id=$1 AND source_dataset=$2
       UNION ALL SELECT 'researchSnapshot',source_document_id,source_revision,source_hash_sha256 FROM ccpun_admin.research_snapshot
       WHERE source_project_id=$1 AND source_dataset=$2
       UNION ALL SELECT 'seoSuggestion',source_document_id,source_revision,source_hash_sha256 FROM ccpun_admin.seo_suggestion
       WHERE source_project_id=$1 AND source_dataset=$2
     ) lineage ORDER BY type,source_document_id`, [SOURCE.projectId,SOURCE.dataset],
  ) as Array<{ type: string; source_document_id: string; source_revision: string; source_hash_sha256: string }>;
  const targetDigest = hash(targetLineage.map((row) => `${row.type}:${row.source_document_id}:${row.source_revision}:${row.source_hash_sha256}`));
  if (targetDigest !== sourceDigest) throw new Error("Postflight deterministic lineage digest mismatch");
  console.log(JSON.stringify({ applied: true, targetCounts, sourceDigest, targetDigest, rollback: "Keep Sanity source documents; disable CCPUN_ADMIN_DATABASE_URL to fail closed." }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Backfill failed"); process.exitCode = 1; });
