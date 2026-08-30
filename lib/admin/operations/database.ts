import "server-only";

import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { safeAuditJson } from "../audit-sanitizer";
import { getAdminEnvironment } from "../environment";
import {
  ADMIN_OPERATIONS_IDENTITY,
  ADMIN_OPERATIONS_MIGRATION_CHECKSUM,
  ADMIN_OPERATIONS_MIGRATION_VERSION,
  isAdminOperationsRuntimeIdentityValid,
} from "./foundation";

const connectionString = process.env.CCPUN_ADMIN_DATABASE_URL?.trim();

function runtimePrecheck() {
  return isAdminOperationsRuntimeIdentityValid({
    environment: process.env.CCPUN_APP_ENV?.trim(),
    projectId: process.env.CCPUN_NEON_PROJECT_ID?.trim(),
    branchId: process.env.CCPUN_NEON_BRANCH_ID?.trim(),
    database: process.env.CCPUN_NEON_DATABASE?.trim(),
    connectionString,
  });
}

async function sqlClient() {
  if (!runtimePrecheck()) return null;
  const sql = neon(connectionString!, { fetchOptions: { signal: AbortSignal.timeout(5_000) } });
  const rows = await sql.query(
    `SELECT current_database() AS database_name, current_user AS role_name,
       EXISTS (
         SELECT 1 FROM ccpun_admin.system_identity
         WHERE singleton=true AND project_id=$1 AND branch_id=$2 AND endpoint_id=$3 AND database_name=$4
           AND migration_version=$5 AND migration_checksum=$6
       ) AS identity_current,
       EXISTS (
         SELECT 1 FROM ccpun_admin.schema_migration WHERE version=$5 AND checksum=$6
       ) AS ledger_current`,
    [ADMIN_OPERATIONS_IDENTITY.projectId, ADMIN_OPERATIONS_IDENTITY.branchId, ADMIN_OPERATIONS_IDENTITY.endpointId, ADMIN_OPERATIONS_IDENTITY.database,
      ADMIN_OPERATIONS_MIGRATION_VERSION, ADMIN_OPERATIONS_MIGRATION_CHECKSUM],
  ) as Array<{ database_name: string; role_name: string; identity_current: boolean; ledger_current: boolean }>;
  const row = rows[0];
  const runtimeIdentityVerified = Boolean(row && row.database_name === ADMIN_OPERATIONS_IDENTITY.database
    && row.role_name === ADMIN_OPERATIONS_IDENTITY.runtimeRole && row.identity_current && row.ledger_current);
  if (!runtimeIdentityVerified) throw new Error("ADMIN_DATABASE_IDENTITY_MISMATCH");
  return sql;
}

export function isAdminOperationsWriteReady() {
  return runtimePrecheck();
}

export type AdminAuditInput = {
  id: string;
  actor: string;
  actorType: "human" | "ai" | "system";
  action: string;
  objectType: string;
  objectId: string;
  before?: unknown;
  after?: unknown;
  requestId: string;
  timestamp: string;
};

export function buildAdminAudit(input: AdminAuditInput) {
  const before = safeAuditJson(input.before);
  const after = safeAuditJson(input.after);
  return {
    ...input,
    before: before ? JSON.parse(before) as unknown : undefined,
    after: after ? JSON.parse(after) as unknown : undefined,
    environment: getAdminEnvironment(),
  };
}

export async function insertAdminAudit(input: AdminAuditInput) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const audit = buildAdminAudit(input);
  await sql.query(
    `INSERT INTO ccpun_admin.audit_log
      (id, actor, actor_type, action, object_type, object_id, before_json, after_json, request_id, environment, occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::uuid,$10,$11::timestamptz)
     ON CONFLICT (id) DO NOTHING`,
    [audit.id, audit.actor, audit.actorType, audit.action, audit.objectType, audit.objectId,
      audit.before === undefined ? null : JSON.stringify(audit.before),
      audit.after === undefined ? null : JSON.stringify(audit.after),
      audit.requestId, audit.environment, audit.timestamp],
  );
}

const auditRowSchema = z.object({
  id: z.string(), actor: z.string().nullish(), actor_type: z.string().nullish(), action: z.string().nullish(),
  object_type: z.string().nullish(), object_id: z.string().nullish(), request_id: z.string().nullish(),
  environment: z.string().nullish(), occurred_at: z.union([z.string(), z.date()]).nullish(),
});

export async function readAdminAudit(limit: number) {
  const sql = await sqlClient();
  if (!sql) return null;
  const rows = await sql.query(
    `SELECT id, actor, actor_type, action, object_type, object_id, request_id::text,
            environment, occurred_at
     FROM ccpun_admin.audit_log ORDER BY occurred_at DESC LIMIT $1`, [limit],
  );
  return z.array(auditRowSchema).parse(rows).map((row) => ({
    id: row.id, actor: row.actor, actorType: row.actor_type, action: row.action,
    objectType: row.object_type, objectId: row.object_id, requestId: row.request_id,
    environment: row.environment,
    timestamp: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
  }));
}

export type ResearchRecord = {
  id: string; keyword: string; keywordKey: string; provider: string; scope?: string; location?: string;
  language?: string; volume?: number; difficulty?: number; intent?: string;
  serp?: unknown[]; competitors?: string[]; checkedAt: string; trustClass: string;
};

const researchRowSchema = z.object({
  id: z.string(), keyword: z.string(), provider: z.string(), scope: z.string().nullish(), location: z.string().nullish(),
  language: z.string().nullish(), volume: z.number().nullish(), difficulty: z.number().nullish(), intent: z.string().nullish(),
  competitors_json: z.array(z.string()).default([]), serp_count: z.number(), checked_at: z.union([z.string(), z.date()]),
  trust_class: z.string().nullish(),
});

export async function findAdminResearchSnapshot(provider: string, keywordKey: string, freshAfter: string) {
  const sql = await sqlClient();
  if (!sql) return null;
  const rows = await sql.query(
    `SELECT id, checked_at FROM ccpun_admin.research_snapshot
     WHERE provider=$1 AND keyword_key=$2 AND checked_at >= $3::timestamptz
     ORDER BY checked_at DESC LIMIT 1`, [provider, keywordKey, freshAfter],
  ) as Array<{ id: string; checked_at: string | Date }>;
  const row = rows[0];
  return row ? { id: row.id, checkedAt: row.checked_at instanceof Date ? row.checked_at.toISOString() : row.checked_at } : null;
}

export async function findAdminProposalResearch(keywordKey: string, freshAfter: string) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const rows = await sql.query(
    `SELECT provider,intent,checked_at FROM ccpun_admin.research_snapshot
     WHERE keyword_key=$1 AND provider IN ('gsc','ubersuggest','serp') AND intent IS NOT NULL AND checked_at >= $2::timestamptz
     ORDER BY checked_at DESC LIMIT 1`, [keywordKey,freshAfter],
  ) as Array<{ provider: string; intent: string | null; checked_at: string | Date }>;
  const row = rows[0];
  return row ? { provider: row.provider, intent: row.intent, checkedAt: iso(row.checked_at) } : null;
}

export async function createAdminResearchSnapshot(record: ResearchRecord, audit: AdminAuditInput, idempotent: boolean) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const cleanAudit = buildAdminAudit(audit);
  const rows = await sql.query(
    `WITH inserted AS (
       INSERT INTO ccpun_admin.research_snapshot
         (id, keyword, keyword_key, provider, scope, location, language, volume, difficulty, intent,
          serp_json, competitors_json, trust_class, checked_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14::timestamptz)
       ON CONFLICT (id) DO NOTHING RETURNING id
     ), audit AS (
       INSERT INTO ccpun_admin.audit_log
         (id, actor, actor_type, action, object_type, object_id, before_json, after_json, request_id, environment, occurred_at)
       SELECT $15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb,$23::uuid,$24,$25::timestamptz FROM inserted
       ON CONFLICT (id) DO NOTHING
     ) SELECT EXISTS(SELECT 1 FROM inserted) AS inserted`,
    [record.id, record.keyword, record.keywordKey, record.provider, record.scope ?? null, record.location ?? null,
      record.language ?? null, record.volume ?? null, record.difficulty ?? null, record.intent ?? null,
      JSON.stringify(record.serp ?? []), JSON.stringify(record.competitors ?? []), record.trustClass, record.checkedAt,
      cleanAudit.id, cleanAudit.actor, cleanAudit.actorType, cleanAudit.action, cleanAudit.objectType, cleanAudit.objectId,
      cleanAudit.before === undefined ? null : JSON.stringify(cleanAudit.before),
      cleanAudit.after === undefined ? null : JSON.stringify(cleanAudit.after), cleanAudit.requestId,
      cleanAudit.environment, cleanAudit.timestamp],
  ) as Array<{ inserted: boolean }>;
  return { id: record.id, reused: idempotent && !rows[0]?.inserted };
}

export async function readAdminResearch(limit: number) {
  const sql = await sqlClient();
  if (!sql) return null;
  const rows = await sql.query(
    `SELECT id, keyword, provider, scope, location, language, volume, difficulty, intent,
            competitors_json, jsonb_array_length(serp_json)::int AS serp_count, checked_at, trust_class
     FROM ccpun_admin.research_snapshot ORDER BY checked_at DESC LIMIT $1`, [limit],
  );
  return z.array(researchRowSchema).parse(rows).map((row) => ({
    id: row.id, keyword: row.keyword, provider: row.provider, scope: row.scope, location: row.location,
    language: row.language, volume: row.volume, difficulty: row.difficulty, intent: row.intent,
    competitors: row.competitors_json, serpCount: row.serp_count,
    checkedAt: row.checked_at instanceof Date ? row.checked_at.toISOString() : row.checked_at,
    trustClass: row.trust_class,
  }));
}

export type SeoSuggestionRecord = {
  id: string; targetDocumentId: string; targetRevision: string; type: string; before?: string | null;
  after: string; reason: string; confidence: number; riskLevel: string; evidence?: unknown[];
  status: string; createdBy: string; createdAt: string;
};

const suggestionDbSchema = z.object({
  id: z.string(), target_document_id: z.string(), target_revision: z.string(), suggestion_type: z.string(),
  before_value: z.string().nullish(), after_value: z.string(), reason: z.string(), confidence: z.number(),
  risk_level: z.string(), status: z.string(), created_by: z.string(), created_at: z.union([z.string(), z.date()]),
  edited_by: z.string().nullish(), edited_at: z.union([z.string(), z.date()]).nullish(),
  reviewed_by: z.string().nullish(), reviewed_at: z.union([z.string(), z.date()]).nullish(),
  approved_after: z.string().nullish(), approved_base_value: z.string().nullish(), approved_type: z.string().nullish(),
  approved_risk_level: z.string().nullish(), approved_target_id: z.string().nullish(), approved_target_revision: z.string().nullish(),
  applied_at: z.union([z.string(), z.date()]).nullish(), row_version: z.coerce.number(), apply_state: z.string().nullish(),
});
export type SuggestionDbRow = z.infer<typeof suggestionDbSchema>;

function iso(value: string | Date | null | undefined) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

export async function readSeoSuggestions() {
  const sql = await sqlClient();
  if (!sql) return null;
  return z.array(suggestionDbSchema).parse(await sql.query(
    `SELECT DISTINCT ON (regexp_replace(id, '^drafts\\.', ''))
            id,target_document_id,target_revision,suggestion_type,before_value,after_value,reason,confidence,risk_level,
            status,created_by,created_at,edited_by,edited_at,reviewed_by,reviewed_at,approved_after,approved_base_value,
            approved_type,approved_risk_level,approved_target_id,approved_target_revision,applied_at,row_version,apply_state
     FROM ccpun_admin.seo_suggestion
     ORDER BY regexp_replace(id, '^drafts\\.', ''), starts_with(id,'drafts.') DESC, created_at DESC`, [],
  ));
}

export async function readSeoSuggestion(id: string) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const rows = z.array(suggestionDbSchema).parse(await sql.query(
    `SELECT id,target_document_id,target_revision,suggestion_type,before_value,after_value,reason,confidence,risk_level,
            status,created_by,created_at,edited_by,edited_at,reviewed_by,reviewed_at,approved_after,approved_base_value,
            approved_type,approved_risk_level,approved_target_id,approved_target_revision,applied_at,row_version,apply_state
     FROM ccpun_admin.seo_suggestion WHERE id=$1`, [id],
  ));
  return rows[0] ?? null;
}

export async function createAdminSeoSuggestion(record: SeoSuggestionRecord, audit: AdminAuditInput, idempotent: boolean) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const cleanAudit = buildAdminAudit(audit);
  const rows = await sql.query(
    `WITH inserted AS (
       INSERT INTO ccpun_admin.seo_suggestion
         (id,target_document_id,target_revision,suggestion_type,before_value,after_value,reason,confidence,risk_level,evidence_json,status,created_by,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13::timestamptz)
       ON CONFLICT (id) DO NOTHING RETURNING id,status
     ), audit AS (
       INSERT INTO ccpun_admin.audit_log
         (id,actor,actor_type,action,object_type,object_id,before_json,after_json,request_id,environment,occurred_at)
       SELECT $14,$15,$16,$17,$18,$19,$20::jsonb,$21::jsonb,$22::uuid,$23,$24::timestamptz FROM inserted
       ON CONFLICT (id) DO NOTHING
     ) SELECT id,status FROM inserted`,
    [record.id, record.targetDocumentId, record.targetRevision, record.type, record.before ?? null, record.after,
      record.reason, record.confidence, record.riskLevel, JSON.stringify(record.evidence ?? []), record.status,
      record.createdBy, record.createdAt, cleanAudit.id, cleanAudit.actor, cleanAudit.actorType, cleanAudit.action,
      cleanAudit.objectType, cleanAudit.objectId, cleanAudit.before === undefined ? null : JSON.stringify(cleanAudit.before),
      cleanAudit.after === undefined ? null : JSON.stringify(cleanAudit.after), cleanAudit.requestId,
      cleanAudit.environment, cleanAudit.timestamp],
  ) as Array<{ id: string; status: string }>;
  if (rows[0]) return rows[0];
  if (!idempotent) throw new Error("SUGGESTION_CONFLICT");
  const existing = await readSeoSuggestion(record.id);
  if (!existing) throw new Error("SUGGESTION_CONFLICT");
  return { id: existing.id, status: existing.status };
}

export async function approveAdminSeoSuggestion(input: {
  id: string; rowVersion: number; reviewedBy: string; reviewedAt: string; approvedBaseValue: string | null;
  approvedTargetRevision: string; requestId: string; auditId: string;
}) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const rows = await sql.query(
    `WITH updated AS (
       UPDATE ccpun_admin.seo_suggestion SET status='approved',reviewed_by=$3,reviewed_at=$4::timestamptz,
         approved_after=after_value,approved_base_value=$5,approved_type=suggestion_type,approved_risk_level=risk_level,
         approved_target_id=target_document_id,approved_target_revision=$6,row_version=row_version+1,updated_at=now()
       WHERE id=$1 AND row_version=$2 AND status='needs-human-review' RETURNING *
     ), audit AS (
       INSERT INTO ccpun_admin.audit_log
         (id,actor,actor_type,action,object_type,object_id,before_json,after_json,request_id,environment,occurred_at)
       SELECT $7,$3,'human','seo-suggestion:approve','seoSuggestion',$1,
         jsonb_build_object('status','needs-human-review'),
         jsonb_build_object('status','approved','approvedType',suggestion_type,'approvedRiskLevel',risk_level,'approvedTargetId',target_document_id,'approvedTargetRevision',$6),
         $8::uuid,$9,$4::timestamptz FROM updated
       ON CONFLICT (id) DO NOTHING
     ) SELECT id,row_version FROM updated`,
    [input.id,input.rowVersion,input.reviewedBy,input.reviewedAt,input.approvedBaseValue,input.approvedTargetRevision,
      input.auditId,input.requestId,getAdminEnvironment()],
  ) as Array<{ id: string; row_version: number }>;
  if (!rows[0]) throw new Error("SUGGESTION_CONFLICT");
  return rows[0];
}

export async function decideAdminSeoSuggestion(input: {
  id: string; rowVersion: number; decision: "edit" | "reject"; after?: string; reason: string;
  reviewer: string; decidedAt: string; requestId: string; auditId: string;
}) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const nextStatus = input.decision === "edit" ? "needs-human-review" : "rejected";
  const rows = await sql.query(
    `WITH updated AS (
       UPDATE ccpun_admin.seo_suggestion SET
         after_value=CASE WHEN $3='edit' THEN $4 ELSE after_value END,
         reason=CASE WHEN $3='edit' THEN $5 ELSE reason END,
         edited_by=CASE WHEN $3='edit' THEN $6 ELSE edited_by END,
         edited_at=CASE WHEN $3='edit' THEN $7::timestamptz ELSE edited_at END,
         status=$8,
         rejection_reason=CASE WHEN $3='reject' THEN $5 ELSE rejection_reason END,
         reviewed_by=CASE WHEN $3='reject' THEN $6 ELSE reviewed_by END,
         reviewed_at=CASE WHEN $3='reject' THEN $7::timestamptz ELSE reviewed_at END,
         row_version=row_version+1,updated_at=now()
       WHERE id=$1 AND row_version=$2 AND status='needs-human-review' RETURNING id
     ), audit AS (
       INSERT INTO ccpun_admin.audit_log
         (id,actor,actor_type,action,object_type,object_id,before_json,after_json,request_id,environment,occurred_at)
       SELECT $9,$6,'human',CASE WHEN $3='edit' THEN 'seo-suggestion:edit' ELSE 'seo-suggestion:reject' END,
         'seoSuggestion',$1,jsonb_build_object('status','needs-human-review'),
         jsonb_build_object('status',$8,'valuePresent',$3='edit','reasonPresent',true),$10::uuid,$11,$7::timestamptz FROM updated
       ON CONFLICT (id) DO NOTHING
     ) SELECT id FROM updated`,
    [input.id,input.rowVersion,input.decision,input.after ?? null,input.reason,input.reviewer,input.decidedAt,nextStatus,
      input.auditId,input.requestId,getAdminEnvironment()],
  ) as Array<{ id: string }>;
  if (!rows[0]) throw new Error("SUGGESTION_CONFLICT");
}

export async function claimAdminSuggestionApply(id: string, rowVersion: number, requestId: string, claimedAt: string) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const rows = await sql.query(
    `UPDATE ccpun_admin.seo_suggestion SET apply_request_id=$3::uuid,apply_state='claimed',apply_claimed_at=$4::timestamptz,
       row_version=row_version+1,updated_at=now()
     WHERE id=$1 AND row_version=$2 AND status='approved' AND apply_state IS NULL RETURNING row_version`,
    [id,rowVersion,requestId,claimedAt],
  ) as Array<{ row_version: number }>;
  if (!rows[0]) throw new Error("SUGGESTION_CONFLICT");
  return rows[0].row_version;
}

export async function finalizeAdminSuggestionApply(input: {
  id: string; rowVersion: number; requestId: string; appliedBy: string; appliedAt: string;
  appliedTargetRevision: string; beforePresent: boolean; fieldPath: string; auditId: string; objectId: string;
}) {
  const sql = await sqlClient();
  if (!sql) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const rows = await sql.query(
    `WITH updated AS (
       UPDATE ccpun_admin.seo_suggestion SET status='applied',apply_state='completed',applied_by=$4,applied_at=$5::timestamptz,
         applied_target_revision=$6,row_version=row_version+1,updated_at=now()
       WHERE id=$1 AND row_version=$2 AND apply_request_id=$3::uuid AND apply_state='claimed' RETURNING id,approved_after
     ), audit AS (
       INSERT INTO ccpun_admin.audit_log
         (id,actor,actor_type,action,object_type,object_id,before_json,after_json,request_id,environment,occurred_at)
       SELECT $9,$4,'human','seo-suggestion:apply-to-draft','article',$11,
         jsonb_build_object('field',$8,'valuePresent',$7),jsonb_build_object('field',$8,'valuePresent',length(approved_after)>0),
         $3::uuid,$10,$5::timestamptz FROM updated
       ON CONFLICT (id) DO NOTHING
     ) SELECT id FROM updated`,
    [input.id,input.rowVersion,input.requestId,input.appliedBy,input.appliedAt,input.appliedTargetRevision,
      input.beforePresent,input.fieldPath,input.auditId,getAdminEnvironment(),input.objectId],
  ) as Array<{ id: string }>;
  if (!rows[0]) throw new Error("APPLY_FINALIZE_AMBIGUOUS");
}

export async function requireApplyReconciliation(id: string, requestId: string, reason: string) {
  try {
    const sql = await sqlClient();
    if (!sql) return;
    await sql.query(
      `UPDATE ccpun_admin.seo_suggestion SET status='reconciliation-required',apply_state='reconciliation-required',
         reconciliation_reason=$3,row_version=row_version+1,updated_at=now()
       WHERE id=$1 AND apply_request_id=$2::uuid AND apply_state='claimed'`, [id,requestId,reason],
    );
  } catch {
    // A durable claimed intent is itself fail-closed and is rendered as reconciliation-required.
  }
}

export function mapSuggestionRow(row: SuggestionDbRow) {
  const effectiveStatus = row.apply_state === "claimed" || row.apply_state === "reconciliation-required"
    ? "reconciliation-required"
    : row.status;
  return {
    id: row.id, articleId: row.target_document_id.replace(/^drafts\./, ""), articleTitle: null,
    type: row.suggestion_type, before: row.before_value, after: row.after_value, reason: row.reason,
    confidence: row.confidence, riskLevel: row.risk_level, approvedAfter: row.approved_after,
    approvedType: row.approved_type, approvedRiskLevel: row.approved_risk_level, status: effectiveStatus,
    createdBy: row.created_by, reviewedBy: row.reviewed_by, createdAt: iso(row.created_at), reviewedAt: iso(row.reviewed_at),
    targetRevision: row.target_revision, approvedTargetRevision: row.approved_target_revision,
    approvedTargetId: row.approved_target_id, targetCurrentRevision: null,
  };
}
