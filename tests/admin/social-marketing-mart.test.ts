import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const version = "20260902_social_marketing_mart_p0";
const checksum = "sha256:ebd2a708c4dc6c524cf93147a3446c3c3cd92b76cb626291a6662c2b7ca878f0";

test("Social Marketing Mart P0 is additive, checksum-locked, and preserves raw provider truth", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  const source = migration.split("-- checksum-source-begin\n")[1]?.split("-- checksum-source-end")[0];
  assert.ok(source);
  assert.equal(`sha256:${createHash("sha256").update(source).digest("hex")}`, checksum);
  assert.match(migration, new RegExp(version));
  assert.match(migration, /20260901_website_42_social_provider_native_history/);
  for (const raw of ["social_provider_content", "social_provider_metric_snapshot"]) {
    assert.match(migration, new RegExp(`ccpun_social\\.${raw}`));
  }
  assert.doesNotMatch(migration, /FROM ccpun_social\.social_provider_content_revision/);
  for (const destructive of [/DROP TABLE/i, /DELETE FROM/i, /TRUNCATE/i, /ALTER TABLE ccpun_social\.social_provider_content/i, /ALTER TABLE ccpun_social\.social_provider_metric_snapshot/i]) {
    assert.doesNotMatch(migration, destructive);
  }
  assert.doesNotMatch(source, /access.?token|refresh.?token|client.?secret/i);
});

test("Marketing content view deduplicates to current provider content and enriches linked editorial identity", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  assert.match(migration, /CREATE OR REPLACE VIEW ccpun_social\.marketing_content_current/);
  assert.match(migration, /FROM ccpun_social\.social_provider_content AS content/);
  assert.doesNotMatch(migration, /FROM ccpun_social\.social_provider_content_revision AS content/);
  assert.match(migration, /'current'::text AS record_type/);
  assert.match(migration, /publication\.variant_id/);
  assert.match(migration, /variant\.master_content_id/);
  assert.match(migration, /AT TIME ZONE 'Asia\/Bangkok'/);
  assert.match(migration, /publish_day_of_week/);
  assert.match(migration, /publish_hour_bkk/);
});

test("Format normalization stays conservative and does not infer multi-image from added_photos", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  assert.match(migration, /'added_photos','photo-post','image','image-post'\) THEN 'image'/);
  assert.match(migration, /'multi_image'\) THEN 'multi_image'/);
  assert.match(migration, /'carousel_album','carousel'\) THEN 'carousel'/);
});

test("Metric capability registry distinguishes requested from not-requested metrics and missing from zero", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS ccpun_social\.social_metric_capability/);
  assert.match(migration, /'meta','facebook','reactions_total','facebook\.likes','requested'/);
  assert.match(migration, /'meta','facebook','reach','facebook\.reach','not_requested'/);
  assert.match(migration, /'meta','instagram','saves','instagram\.saves','not_requested'/);
  assert.match(migration, /WHEN observation\.native_metric_key IS NOT NULL THEN 'available'/);
  assert.match(migration, /WHEN capability\.collection_state = 'requested' THEN 'not_returned'/);
  assert.doesNotMatch(migration, /COALESCE\(observation\.metric_value,\s*0\)/i);
});

test("Performance mart exposes snapshot windows and refuses normalized ratios without reach", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  assert.match(migration, /CREATE OR REPLACE VIEW ccpun_social\.post_performance_snapshot/);
  for (const window of ["24h", "7d", "28d", "latest"]) assert.match(migration, new RegExp(`'${window}'`));
  assert.match(migration, /post_age_hours/);
  assert.match(migration, /target_window_hours/);
  assert.match(migration, /WHEN metrics\.reach IS NULL OR metrics\.reach = 0 THEN NULL/);
  assert.match(migration, /engagement_rate_by_reach/);
  assert.match(migration, /deep_engagement_rate/);
});

test("Facebook share QA preserves raw values and only flags suspicious observations", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS ccpun_social\.social_data_quality_review/);
  assert.match(migration, /FB_SHARE_OUTLIER/);
  assert.match(migration, /performance\.shares > performance\.reactions_total \* 5/);
  assert.match(migration, /THEN 'needs_review'/);
  assert.match(migration, /ELSE 'unreviewed'/);
  assert.doesNotMatch(migration, /UPDATE\s+ccpun_social\.social_provider_metric_snapshot/i);
  assert.doesNotMatch(migration, /SET\s+shares\s*=/i);
});

test("Marketing mart remains read-only to the restricted runtime role", () => {
  const migration = read("db/migrations/20260902_social_marketing_mart_p0.sql");
  const readback = read("db/migrations/20260902_social_marketing_mart_p0_readback.sql");
  assert.match(migration, /GRANT SELECT ON ccpun_social\.social_metric_capability, ccpun_social\.social_data_quality_review TO ccpun_social_runtime/);
  assert.match(migration, /GRANT SELECT ON ccpun_social\.marketing_content_current, ccpun_social\.post_metric_status, ccpun_social\.post_performance_snapshot, ccpun_social\.post_data_quality TO ccpun_social_runtime/);
  assert.doesNotMatch(migration, /GRANT (?:INSERT|UPDATE|DELETE)[^;]*social_data_quality_review TO ccpun_social_runtime/i);
  assert.match(readback, /runtime_qa_write_denied/);
});

test("Production bootstrap includes the Marketing Mart migration and readback requires the current migration ledger", () => {
  const cwd = new URL("../..", import.meta.url);
  const bootstrap = execFileSync(process.execPath, ["scripts/build-social-production-bootstrap.mjs"], { cwd, encoding: "utf8" });
  const readback = execFileSync(process.execPath, ["scripts/build-social-production-bootstrap.mjs", "--readback"], { cwd, encoding: "utf8" });
  assert.match(bootstrap, new RegExp(version));
  assert.match(bootstrap, new RegExp(checksum.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(readback, /count\(\*\) = 11/);
  assert.match(readback, new RegExp(version));
  assert.match(readback, new RegExp(checksum.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
