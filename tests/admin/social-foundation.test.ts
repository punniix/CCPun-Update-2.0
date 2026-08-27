import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import {
  canTransitionPublicationStatus,
  isSocialFoundationEnabled,
  socialFoundationSnapshotSchema,
  socialVariantSchema,
  SYNTHETIC_SOCIAL_FOUNDATION,
  WEBSITE_42_SOCIAL_BRANCH,
} from "../../lib/admin/social-foundation";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("synthetic Social foundation fixture is bounded and contains no real platform IDs", () => {
  const parsed = socialFoundationSnapshotSchema.parse(SYNTHETIC_SOCIAL_FOUNDATION);
  assert.equal(parsed.mode, "synthetic-uat");
  assert.equal(parsed.variants.length, 3);
  assert.ok(parsed.variants.every((variant) => variant.id.startsWith("synthetic-")));
});

test("Social foundation rejects unknown state and publishing mode", () => {
  const source = SYNTHETIC_SOCIAL_FOUNDATION.variants[0];
  assert.equal(socialVariantSchema.safeParse({ ...source, status: "publish-now" }).success, false);
  assert.equal(socialVariantSchema.safeParse({ ...source, publishingMode: "background-magic" }).success, false);
});

test("publication state transitions require approval and never reopen a published item", () => {
  assert.equal(canTransitionPublicationStatus("draft", "approved"), true);
  assert.equal(canTransitionPublicationStatus("draft", "published"), false);
  assert.equal(canTransitionPublicationStatus("approved", "native-scheduled"), true);
  assert.equal(canTransitionPublicationStatus("failed", "queued"), true);
  assert.equal(canTransitionPublicationStatus("published", "draft"), false);
});

test("Social foundation fails closed outside the exact Admin UAT branch", () => {
  const allowed = {
    flag: "1",
    dataMode: "synthetic",
    environment: "admin-uat" as const,
    projectId: CCPUN_VERCEL_PROJECT_IDS.adminProduction,
    gitBranch: WEBSITE_42_SOCIAL_BRANCH,
  };

  assert.equal(isSocialFoundationEnabled(allowed), true);
  assert.equal(isSocialFoundationEnabled({ ...allowed, environment: "production-admin" }), false);
  assert.equal(isSocialFoundationEnabled({ ...allowed, gitBranch: "codex/another-preview" }), false);
  assert.equal(isSocialFoundationEnabled({ ...allowed, projectId: CCPUN_VERCEL_PROJECT_IDS.web }), false);
  assert.equal(isSocialFoundationEnabled({ ...allowed, flag: "0" }), false);
  assert.equal(isSocialFoundationEnabled({ ...allowed, dataMode: "database" }), false);
});

test("operational schema enforces encrypted credentials, idempotency, and bounded states", () => {
  const sql = read("db/migrations/0001_social_foundation.sql");
  assert.match(sql, /encrypted_credentials bytea/);
  assert.match(sql, /status <> 'connected'[\s\S]*?encrypted_credentials IS NOT NULL/);
  assert.match(sql, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(sql, /REFERENCES ccpun_social\.social_publication\(id\)/);
  assert.match(sql, /CHECK \(position BETWEEN 1 AND 20\)/);
  assert.doesNotMatch(sql, /access_token|refresh_token|customer_email/i);
});

test("Sanity owns editorial variants without credential fields", () => {
  const schema = read("cms/sanity/socialTypes.ts");
  assert.match(schema, /name: "masterContent"/);
  assert.match(schema, /name: "socialVariant"/);
  assert.match(schema, /name: "variants"[\s\S]*?type: "socialVariant"/);
  assert.match(schema, /type: "reviewMetadata"/);
  assert.doesNotMatch(schema, /token|secret|credential/i);
});

test("Social foundation API is authenticated read-only synthetic UAT", () => {
  const route = read("app/api/snt-admin/social/foundation/route.ts");
  assert.match(route, /getAdminIdentity\(\)/);
  assert.match(route, /hasAdminPermission\(identity\.role, "dashboard:read"\)/);
  assert.match(route, /getSocialFoundationRuntimeStatus\(\)/);
  assert.match(route, /SYNTHETIC_SOCIAL_FOUNDATION/);
  assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/);
});
