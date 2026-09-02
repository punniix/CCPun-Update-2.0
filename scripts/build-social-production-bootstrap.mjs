import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const migrationRoot = new URL("../db/migrations/", import.meta.url);
const production = {
  projectId: "lively-bar-43618798",
  branchId: "br-long-resonance-b3ys5xrv",
  endpointId: "ep-broad-butterfly-b3ro7u8w",
  database: "neondb",
};
const uat = {
  projectId: "young-term-47483330",
  branchId: "br-crimson-mouse-az7ajkv8",
  endpointId: "ep-mute-frost-aztvz394",
};
const analytics = {
  uatVersion: "20260831_website_42_social_analytics_ingestion",
  uatChecksum: "sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c",
  productionVersion: "20260901_website_42_social_analytics_ingestion_production",
};

function read(name) {
  return readFileSync(new URL(name, migrationRoot), "utf8").trim();
}

function withoutTransaction(sql) {
  return sql.replace(/^BEGIN;\s*/, "").replace(/\s*COMMIT;$/, "");
}

function replaceAll(sql, values) {
  return Object.entries(values).reduce((result, [from, to]) => result.replaceAll(from, to), sql);
}

function checksumSource(sql) {
  const source = sql.split("-- checksum-source-begin\n")[1]?.split("-- checksum-source-end")[0];
  if (!source) throw new Error("Migration checksum source is missing");
  return `sha256:${createHash("sha256").update(source).digest("hex")}`;
}

function productionAnalytics() {
  let sql = replaceAll(read("20260831_website_42_social_analytics_ingestion.sql"), {
    [uat.projectId]: production.projectId,
    [uat.branchId]: production.branchId,
    [uat.endpointId]: production.endpointId,
    [analytics.uatVersion]: analytics.productionVersion,
  });
  const checksum = checksumSource(sql);
  sql = sql.replaceAll(analytics.uatChecksum, checksum);
  return { sql: withoutTransaction(sql), checksum };
}

function productionFollowup(name, checksum) {
  return withoutTransaction(replaceAll(read(name), {
    [uat.projectId]: production.projectId,
    [uat.branchId]: production.branchId,
    [uat.endpointId]: production.endpointId,
    [analytics.uatVersion]: analytics.productionVersion,
    [analytics.uatChecksum]: checksum,
  }));
}

function bootstrap() {
  const prodAnalytics = productionAnalytics();
  const blocks = [
    "20260828_website_42_social_foundation_v2.sql",
    "20260828_website_42_media_library_foundation.sql",
    "20260829_website_42_social_post_formats.sql",
  ].map((name) => withoutTransaction(read(name)));
  blocks.push(
    prodAnalytics.sql,
    productionFollowup("20260901_website_42_social_provider_native_history.sql", prodAnalytics.checksum),
    productionFollowup("20260901_website_42_social_publication_execution_v1.sql", prodAnalytics.checksum),
    productionFollowup("20260901_website_42_social_comment_execution_v1.sql", prodAnalytics.checksum),
    withoutTransaction(read("20260902_social_marketing_mart_p0.sql")),
    withoutTransaction(read("20260902_social_marketing_mart_p1_meta_insights.sql")),
  );
  return [
    "-- CCPun social Production bootstrap",
    `-- project=${production.projectId} branch=${production.branchId} endpoint=${production.endpointId} database=${production.database}`,
    "-- Run as the Neon database owner. The runtime role must already exist.",
    "BEGIN;",
    ...blocks,
    "COMMIT;",
    "",
  ].join("\n\n");
}

function readback() {
  const { checksum } = productionAnalytics();
  return `SELECT
  current_database() = '${production.database}' AS database_ok,
  EXISTS (
    SELECT 1 FROM ccpun_social.system_identity
    WHERE singleton
      AND project_id = '${production.projectId}'
      AND branch_id = '${production.branchId}'
      AND endpoint_id = '${production.endpointId}'
      AND database_name = '${production.database}'
      AND migration_version = '${analytics.productionVersion}'
      AND migration_checksum = '${checksum}'
  ) AS identity_ok,
  (SELECT count(*) = 9 FROM ccpun_social.schema_migration WHERE (version, checksum) IN (
    ('20260828_website_42_social_foundation_v2', 'sha256:b6ad0b823775df1dcfc06e0da896dfcc477cfbeae897b70e228c18a051712acb'),
    ('20260828_website_42_media_library_foundation', 'sha256:9c5a76125a6cecc90a1693aabd7925c04f8473de0fa0d3206b6188fb427bfb55'),
    ('20260829_website_42_social_post_formats', 'sha256:64d8471247fa28a08fcb99cda5b4df87e73f7ed1dc497250da26d01119ade977'),
    ('${analytics.productionVersion}', '${checksum}'),
    ('20260901_website_42_social_provider_native_history', 'sha256:cc4c2516ad261983d3d3997796711fb9b0290afe8625ab82fc002f4536bc549c'),
    ('20260901_website_42_social_publication_execution_v1', 'sha256:9c9a95c3f29d0c912b6b0c226fea873569809f49ebc8f1a66ab32699bde85bba'),
    ('20260901_website_42_social_comment_execution_v1', 'sha256:c9a5512469d8894ccbdebf5c051d7471aef1f9d59973b6a71f5d0f2b7618155d'),
    ('20260902_social_marketing_mart_p0', 'sha256:ebd2a708c4dc6c524cf93147a3446c3c3cd92b76cb626291a6662c2b7ca878f0'),
    ('20260902_social_marketing_mart_p1_meta_insights', 'sha256:7bdc2c2b80b59d7364d92ec88dd66ccd5472390291bf0bc3ba82ec424718f671')
  )) AS migrations_ok,
  EXISTS (
    SELECT 1
    FROM pg_roles role
    WHERE role.rolname = 'ccpun_social_runtime'
      AND role.rolcanlogin
      AND NOT role.rolsuper
      AND NOT role.rolcreatedb
      AND NOT role.rolcreaterole
      AND NOT role.rolinherit
      AND NOT role.rolreplication
      AND NOT role.rolbypassrls
      AND NOT EXISTS (
        SELECT 1 FROM pg_auth_members membership WHERE membership.member = role.oid
      )
  ) AS runtime_role_restricted,
  has_schema_privilege('ccpun_social_runtime', 'ccpun_social', 'USAGE') AS runtime_schema_usage,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_content', 'SELECT,INSERT') AS provider_content_grants_ok,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'SELECT,INSERT') AS publication_grants_ok,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'DELETE')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'TRUNCATE')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'REFERENCES')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'TRIGGER')
    AS unsafe_publication_grants_denied;`;
}

process.stdout.write(process.argv.includes("--readback") ? readback() : bootstrap());
