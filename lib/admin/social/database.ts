import "server-only";

import { neon } from "@neondatabase/serverless";
import {
  classifySocialDatabaseError,
  isSocialDatabaseConnectionString,
  SOCIAL_SCHEMA_MIGRATION_CHECKSUM,
  SOCIAL_SCHEMA_MIGRATION_VERSION,
  type SocialDatabaseReadiness,
} from "./foundation";

export async function getSocialDatabaseReadiness(
  connectionString = process.env.CCPUN_SOCIAL_DATABASE_URL?.trim(),
): Promise<SocialDatabaseReadiness> {
  if (!connectionString) {
    return { configured: false, reachable: false, migrationCurrent: false, errorCategory: "not-configured" };
  }
  if (!isSocialDatabaseConnectionString(connectionString)) {
    return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "invalid-configuration" };
  }

  try {
    const sql = neon(connectionString, { fetchOptions: { signal: AbortSignal.timeout(3_000) } });
    const rows = await sql.query(
      `SELECT EXISTS (
        SELECT 1
        FROM ccpun_social.schema_migration
        WHERE version = $1 AND checksum = $2
      ) AS migration_current`,
      [SOCIAL_SCHEMA_MIGRATION_VERSION, SOCIAL_SCHEMA_MIGRATION_CHECKSUM],
    ) as Array<{ migration_current: boolean }>;
    return {
      configured: true,
      reachable: true,
      migrationCurrent: rows[0]?.migration_current === true,
      errorCategory: rows[0]?.migration_current === true ? null : "migration-missing",
    };
  } catch (error) {
    return classifySocialDatabaseError(error);
  }
}
