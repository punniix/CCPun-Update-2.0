import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const migrationVersion = "20260831_website_42_social_analytics_ingestion";
const migrationChecksum = "sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c";

test("analytics ingestion opens only on the exact Admin and Neon UAT lane", () => {
  const service = read("lib/admin/social/analytics-ingestion.ts");
  for (const required of [
    /CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED === "1"/,
    /=== "admin-uat"/,
    /WEBSITE_42_SOCIAL_ANALYTICS_BRANCH/,
    /WEBSITE_42_SANITY_PROJECT_ID/,
    /WEBSITE_42_SANITY_DATASET/,
    /CCPUN_NEON_PROJECT_ID[\s\S]*UAT_NEON\.projectId/,
    /CCPUN_NEON_BRANCH_ID[\s\S]*UAT_NEON\.branchId/,
    /CCPUN_NEON_ENDPOINT_ID[\s\S]*UAT_NEON\.endpointId/,
    /decodeURIComponent\(url\.username\) === UAT_NEON\.role/,
    /Boolean\(url\.password\)/,
  ]) assert.match(service, required);
  assert.match(service, /import "server-only"/);
});

test("analytics migration is checksum-locked, UAT-identified and least privilege", () => {
  const migration = read("db/migrations/20260831_website_42_social_analytics_ingestion.sql");
  const source = migration.split("-- checksum-source-begin\n")[1]?.split("-- checksum-source-end")[0];
  assert.ok(source);
  assert.equal(`sha256:${createHash("sha256").update(source).digest("hex")}`, migrationChecksum);
  assert.match(migration, new RegExp(migrationVersion));
  for (const identity of ["young-term-47483330", "br-crimson-mouse-az7ajkv8", "ep-mute-frost-aztvz394", "neondb"]) assert.match(migration, new RegExp(identity));
  for (const table of ["system_identity", "social_metric_snapshot", "social_provider_sync_state"]) assert.match(migration, new RegExp(`ccpun_social\\.${table}`));
  assert.match(migration, /GRANT UPDATE \(cursor, status, last_attempt_at, last_success_at, last_error_category, updated_at\)/);
  assert.match(migration, /IF NOT EXISTS \(SELECT 1 FROM pg_roles WHERE rolname = 'ccpun_social_runtime'\)/);
  assert.doesNotMatch(migration, /CREATE ROLE|DROP TABLE|DELETE FROM|TRUNCATE/i);
  assert.doesNotMatch(source, /access.?token|refresh.?token|client.?secret/i);
});

test("readback avoids broad catalog checks and verifies every write boundary", () => {
  const readback = read("db/migrations/20260831_website_42_social_analytics_ingestion_readback.sql");
  for (const field of ["database_ok", "checksum_ok", "identity_ok", "runtime_role_restricted", "required_grants_ok", "sync_update_columns_ok", "unrelated_tables_denied", "sequences_denied", "unsafe_grants_denied"]) {
    assert.match(readback, new RegExp(field));
  }
  assert.match(readback, /column_name::text/);
  assert.match(readback, /namespace\.nspname = 'ccpun_social'[\s\S]*relation\.relkind = 'S'/);
  assert.doesNotMatch(readback, /pg_toast/);
});

test("manual provider persistence stays human-only, same-origin and provider-write free", () => {
  const route = read("app/api/snt-admin/social/analytics/sync/[provider]/route.ts");
  const service = read("lib/admin/social/analytics-ingestion.ts");
  const panel = read("features/admin/social/provider-readonly-panels.tsx");
  const dashboard = read("features/admin/social/analytics-page.tsx");
  assert.match(route, /getAdminIdentity\(\)/);
  assert.match(route, /identity\.actorType !== "human"/);
  assert.match(route, /hasAdminPermission\(identity\.role, "social:read"\)/);
  assert.match(route, /isSameOriginAdminMutation\(request\.url, request\.headers\.get\("origin"\)\)/);
  assert.match(route, /socialAnalyticsProviderSchema\.safeParse/);
  assert.match(route, /export async function POST\(request: Request/);
  assert.doesNotMatch(route, /export async function (?:GET|PUT|PATCH|DELETE)/);
  assert.match(service, /variant\.channel IN \('facebook','instagram','youtube','tiktok'\)/);
  assert.match(service, /fetchMetaReadOnlyDiscovery/);
  assert.match(service, /fetchYouTubeReadOnlyDiscovery/);
  assert.match(service, /fetchTikTokReadOnlyDiscovery/);
  assert.match(service, /ON CONFLICT \(id\) DO NOTHING/);
  assert.match(service, /collection_mode/);
  assert.doesNotMatch(service, /video\.upload|video\.publish|setInterval|cron/);
  assert.match(panel, /Sync และบันทึกสถิติย้อนหลัง/);
  assert.match(dashboard, /ไม่รวม Views\/Reach ข้ามแพลตฟอร์ม/);
  assert.match(dashboard, /metric\.delta/);
});
