import { neon } from "@neondatabase/serverless";
import { safeAuditJson } from "../lib/admin/audit-sanitizer";
import {
  ADMIN_OPERATIONS_IDENTITY,
  ADMIN_OPERATIONS_MIGRATION_CHECKSUM,
  ADMIN_OPERATIONS_MIGRATION_VERSION,
  isAdminOperationsRuntimeIdentityValid,
} from "../lib/admin/operations/foundation";

type EnvironmentInput = Record<string, string | undefined>;

export async function appendScriptAdminAudit(input: {
  id: string; action: string; objectId: string; requestId: string; timestamp: string;
  before?: unknown; after?: unknown;
}, environment: EnvironmentInput = process.env) {
  const connectionString = environment.CCPUN_ADMIN_DATABASE_URL?.trim();
  if (!isAdminOperationsRuntimeIdentityValid({
    environment: environment.CCPUN_APP_ENV?.trim(), projectId: environment.CCPUN_NEON_PROJECT_ID?.trim(),
    branchId: environment.CCPUN_NEON_BRANCH_ID?.trim(), database: environment.CCPUN_NEON_DATABASE?.trim(), connectionString,
  })) throw new Error("Neon Admin audit is not configured for the exact UAT lane");
  const sql = neon(connectionString!, { fetchOptions: { signal: AbortSignal.timeout(5_000) } });
  const identity = await sql.query(
    `SELECT current_database() AS database_name,current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_admin.system_identity WHERE singleton=true AND project_id=$1 AND branch_id=$2
         AND database_name=$3 AND migration_version=$4 AND migration_checksum=$5) AS identity_current,
       EXISTS (SELECT 1 FROM ccpun_admin.schema_migration WHERE version=$4 AND checksum=$5) AS ledger_current`,
    [ADMIN_OPERATIONS_IDENTITY.projectId,ADMIN_OPERATIONS_IDENTITY.branchId,ADMIN_OPERATIONS_IDENTITY.database,
      ADMIN_OPERATIONS_MIGRATION_VERSION,ADMIN_OPERATIONS_MIGRATION_CHECKSUM],
  ) as Array<{ database_name: string; role_name: string; identity_current: boolean; ledger_current: boolean }>;
  const row = identity[0];
  if (!row || row.database_name !== ADMIN_OPERATIONS_IDENTITY.database || row.role_name !== ADMIN_OPERATIONS_IDENTITY.runtimeRole
    || !row.identity_current || !row.ledger_current) throw new Error("Neon Admin audit identity mismatch");
  const before = safeAuditJson(input.before);
  const after = safeAuditJson(input.after);
  await sql.query(
    `INSERT INTO ccpun_admin.audit_log
      (id,actor,actor_type,action,object_type,object_id,before_json,after_json,request_id,environment,occurred_at)
     VALUES ($1,'taxonomy-migration','system',$2,'article-batch',$3,$4::jsonb,$5::jsonb,$6::uuid,'admin-uat',$7::timestamptz)
     ON CONFLICT (id) DO NOTHING`,
    [input.id,input.action,input.objectId,before ?? null,after ?? null,input.requestId,input.timestamp],
  );
}

