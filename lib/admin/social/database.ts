import "server-only";

import { neon } from "@neondatabase/serverless";
import {
  MEDIA_SCHEMA_MIGRATION_CHECKSUM,
  MEDIA_SCHEMA_MIGRATION_VERSION,
} from "../media/foundation";
import {
  classifySocialDatabaseError,
  isSocialDatabaseSchemaCurrent,
  isSocialDatabaseConnectionString,
  SOCIAL_SCHEMA_MIGRATION_CHECKSUM,
  SOCIAL_SCHEMA_MIGRATION_VERSION,
  SOCIAL_FORMAT_MIGRATION_CHECKSUM,
  SOCIAL_FORMAT_MIGRATION_VERSION,
  type SocialDatabaseReadiness,
} from "./foundation";
import { resolveSocialRuntime, SOCIAL_UAT_RUNTIME_BRANCHES } from "./runtime";

export async function getSocialDatabaseReadiness(
  connectionString = process.env.CCPUN_SOCIAL_DATABASE_URL?.trim(),
  env: Record<string, string | undefined> = process.env,
): Promise<SocialDatabaseReadiness> {
  if (!connectionString) {
    return { configured: false, reachable: false, migrationCurrent: false, errorCategory: "not-configured" };
  }
  if (!isSocialDatabaseConnectionString(connectionString)) {
    return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "invalid-configuration" };
  }
  const runtime = resolveSocialRuntime({ ...env, CCPUN_SOCIAL_DATABASE_URL: connectionString }, {
    uatBranches: SOCIAL_UAT_RUNTIME_BRANCHES,
    requireUatNeon: true,
  });
  if (!runtime) {
    return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "invalid-configuration" };
  }

  try {
    const sql = neon(connectionString, { fetchOptions: { signal: AbortSignal.timeout(3_000) } });
    const rows = await sql.query(
      `SELECT
       EXISTS (
        SELECT 1
        FROM ccpun_social.schema_migration
        WHERE version = $1 AND checksum = $2
       ) AS ledger_current,
       EXISTS (
        SELECT 1
        FROM ccpun_social.schema_migration
        WHERE version = $3 AND checksum = $4
       ) AS format_ledger_current,
       EXISTS (
        SELECT 1
        FROM ccpun_social.schema_migration
        WHERE version = $5 AND checksum = $6
       ) AS media_ledger_current,
       EXISTS (
        SELECT 1
        FROM ccpun_social.system_identity
        WHERE singleton = true AND project_id = $7 AND branch_id = $8
          AND endpoint_id = $9 AND database_name = $10
       ) AS identity_current,
       to_regclass('ccpun_social.social_media_asset') IS NOT NULL AS media_asset_exists,
       to_regclass('ccpun_social.social_variant_link') IS NOT NULL AS variant_link_exists,
       to_regclass('ccpun_social.social_publication') IS NOT NULL AS publication_exists,
       to_regclass('ccpun_social.social_publication_job') IS NOT NULL AS publication_job_exists,
       to_regclass('ccpun_social.social_comment_item') IS NOT NULL AS comment_item_exists,
       to_regclass('ccpun_social.social_execution_audit') IS NOT NULL AS execution_audit_exists,
       to_regclass('ccpun_social.media_storage_object') IS NOT NULL AS media_storage_object_exists,
       to_regclass('ccpun_social.media_upload_session') IS NOT NULL AS media_upload_session_exists,
       to_regclass('ccpun_social.social_variant_media') IS NOT NULL AS social_variant_media_exists`,
      [
        SOCIAL_SCHEMA_MIGRATION_VERSION,
        SOCIAL_SCHEMA_MIGRATION_CHECKSUM,
        SOCIAL_FORMAT_MIGRATION_VERSION,
        SOCIAL_FORMAT_MIGRATION_CHECKSUM,
        MEDIA_SCHEMA_MIGRATION_VERSION,
        MEDIA_SCHEMA_MIGRATION_CHECKSUM,
        runtime.neonIdentity.projectId,
        runtime.neonIdentity.branchId,
        runtime.neonIdentity.endpointId,
        runtime.neonIdentity.database,
      ],
    ) as Array<{
      ledger_current: boolean;
      format_ledger_current: boolean;
      media_ledger_current: boolean;
      identity_current: boolean;
      media_asset_exists: boolean;
      variant_link_exists: boolean;
      publication_exists: boolean;
      publication_job_exists: boolean;
      comment_item_exists: boolean;
      execution_audit_exists: boolean;
      media_storage_object_exists: boolean;
      media_upload_session_exists: boolean;
      social_variant_media_exists: boolean;
    }>;
    const row = rows[0];
    const migrationCurrent = Boolean(row?.identity_current && isSocialDatabaseSchemaCurrent({
      ledgerCurrent: row.ledger_current,
      formatLedgerCurrent: row.format_ledger_current,
      mediaLedgerCurrent: row.media_ledger_current,
      tables: {
        social_media_asset: row.media_asset_exists,
        social_variant_link: row.variant_link_exists,
        social_publication: row.publication_exists,
        social_publication_job: row.publication_job_exists,
        social_comment_item: row.comment_item_exists,
        social_execution_audit: row.execution_audit_exists,
        media_storage_object: row.media_storage_object_exists,
        media_upload_session: row.media_upload_session_exists,
        social_variant_media: row.social_variant_media_exists,
      },
    }));
    return {
      configured: true,
      reachable: true,
      migrationCurrent,
      errorCategory: migrationCurrent ? null : "migration-missing",
    };
  } catch (error) {
    return classifySocialDatabaseError(error);
  }
}
