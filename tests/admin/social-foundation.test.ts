import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import {
  classifySocialDatabaseError,
  canTransitionPublicationStatus,
  isSocialDatabaseConnectionString,
  isSocialFoundationEnabled,
  SOCIAL_SCHEMA_MIGRATION_CHECKSUM,
  SOCIAL_SCHEMA_MIGRATION_VERSION,
  socialFoundationSnapshotSchema,
  SYNTHETIC_SOCIAL_FOUNDATION,
  WEBSITE_42_SANITY_DATASET,
  WEBSITE_42_SANITY_PROJECT_ID,
  WEBSITE_42_SOCIAL_BRANCH,
} from "../../lib/admin/social/foundation";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const enabledInput = {
  flag: "1",
  dataMode: "synthetic",
  environment: "admin-uat" as const,
  projectId: CCPUN_VERCEL_PROJECT_IDS.adminProduction,
  gitBranch: WEBSITE_42_SOCIAL_BRANCH,
  sanityProjectId: WEBSITE_42_SANITY_PROJECT_ID,
  sanityDataset: WEBSITE_42_SANITY_DATASET,
};

test("Social foundation requires the exact Admin UAT code and data plane", () => {
  assert.equal(isSocialFoundationEnabled(enabledInput), true);
  for (const change of [
    { flag: "true" },
    { dataMode: "live" },
    { environment: "production-admin" as const },
    { projectId: CCPUN_VERCEL_PROJECT_IDS.web },
    { gitBranch: "v4-production" },
    { sanityProjectId: "kyfxgjnq" },
    { sanityDataset: "production" },
  ]) {
    assert.equal(isSocialFoundationEnabled({ ...enabledInput, ...change }), false, JSON.stringify(change));
  }
});

test("Synthetic fixtures validate and remain detached from real accounts and media", () => {
  const result = socialFoundationSnapshotSchema.parse(SYNTHETIC_SOCIAL_FOUNDATION);
  assert.equal(result.mode, "synthetic-uat");
  assert.equal(result.variants.every((variant) => variant.masterContentId === result.masterContent.id), true);
  assert.equal(JSON.stringify(result).includes("accessToken"), false);
  assert.equal(JSON.stringify(result).includes("platformObjectId"), false);
});

test("Publication state transitions are explicit and terminal states stay terminal", () => {
  assert.equal(canTransitionPublicationStatus("draft", "approved"), true);
  assert.equal(canTransitionPublicationStatus("approved", "native-scheduled"), true);
  assert.equal(canTransitionPublicationStatus("failed", "queued"), true);
  assert.equal(canTransitionPublicationStatus("draft", "published"), false);
  assert.equal(canTransitionPublicationStatus("published", "draft"), false);
  assert.equal(canTransitionPublicationStatus("cancelled", "queued"), false);
});

test("Database readiness is read-only and returns sanitized categories", () => {
  assert.equal(isSocialDatabaseConnectionString("postgresql://user:pass@branch-pooler.neon.tech/db"), true);
  assert.equal(isSocialDatabaseConnectionString("postgresql://not-neon.example/db"), false);
  assert.equal(isSocialDatabaseConnectionString("not-a-url"), false);
  assert.equal(classifySocialDatabaseError({ code: "28P01", message: "credential detail" }).errorCategory, "authentication");
  assert.equal(classifySocialDatabaseError({ code: "42P01", message: "raw schema detail" }).errorCategory, "migration-missing");
  assert.equal(classifySocialDatabaseError({ name: "TimeoutError", message: "raw timeout" }).errorCategory, "timeout");

  const source = read("lib/admin/social/database.ts");
  assert.match(source, /import "server-only"/);
  assert.match(source, /FROM ccpun_social\.schema_migration/);
  assert.doesNotMatch(source, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP)\b/i);
  assert.doesNotMatch(source, /console\./);
});

test("Migration checksum covers the reviewed DDL and operational constraints", () => {
  const sql = read("db/migrations/20260828_website_42_social_foundation_v2.sql");
  const body = sql.split("-- checksum-source-begin\n")[1]?.split("-- checksum-source-end")[0];
  assert.ok(body);
  const checksum = `sha256:${createHash("sha256").update(body).digest("hex")}`;
  assert.equal(checksum, SOCIAL_SCHEMA_MIGRATION_CHECKSUM);
  assert.match(sql, new RegExp(SOCIAL_SCHEMA_MIGRATION_VERSION));
  assert.match(sql, new RegExp(SOCIAL_SCHEMA_MIGRATION_CHECKSUM));
  assert.match(sql, /schema_migration/);
  assert.match(sql, /social_variant_link/);
  assert.match(sql, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(sql, /job_type text NOT NULL CHECK/);
  assert.match(sql, /lock_owner text/);
  assert.match(sql, /lock_expires_at > locked_at/);
  assert.match(sql, /FOREIGN KEY \(parent_item_id, publication_id\)/);
  assert.match(sql, /last_error_ref text CHECK/);
  assert.doesNotMatch(sql, /credential|refresh_token|access_token|encrypted_credentials/i);
});

test("Social API is authenticated, owner-scoped, exact-origin and read-only", () => {
  const route = read("app/api/snt-admin/social/foundation/route.ts");
  const page = read("app/snt-admin/(protected)/distribution/page.tsx");
  assert.match(route, /getAdminIdentity\(\)/);
  assert.match(route, /hasAdminPermission\(identity\.role, "social:read"\)/);
  assert.match(route, /isConfiguredAdminOrigin\(request\.url, process\.env\.AUTH_URL\)/);
  assert.match(route, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(route, /publish|mutate|createClient/);
  assert.equal(page.trim(), 'export { metadata, default } from "@/features/admin/social/page";');
});

test("Sanity keeps the canonical parent reference and excludes operational fields", () => {
  const master = read("cms/sanity/schema/documents/master-content.ts");
  const variant = read("cms/sanity/schema/documents/social-variant.ts");
  const comment = read("cms/sanity/schema/objects/social-comment-series-item.ts");
  assert.doesNotMatch(master, /name: "variants"/);
  assert.match(variant, /name: "masterContent"[\s\S]*?type: "reference"[\s\S]*?type: "masterContent"[\s\S]*?Rule\.required/);
  assert.match(variant, /type: "socialCommentSeriesItem"/);
  assert.match(comment, /name: "position"/);
  for (const source of [master, variant, comment]) {
    assert.doesNotMatch(source, /platformObjectId|idempotencyKey|publicationStatus|accessToken|refreshToken/);
  }
});
