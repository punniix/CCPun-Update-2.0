import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const provider = readFileSync("lib/admin/ubersuggest.ts", "utf8");
const normalized = readFileSync("lib/admin/ubersuggest-dashboard-provider.ts", "utf8");
const snapshots = readFileSync("lib/admin/ubersuggest-dashboard.ts", "utf8");
const route = readFileSync("app/api/snt-admin/providers/ubersuggest/sync/route.ts", "utf8");
const page = readFileSync("app/snt-admin/(protected)/ubersuggest/page.tsx", "utf8");
const schema = readFileSync("cms/sanity/ubersuggestTypes.ts", "utf8");
const studioPolicy = readFileSync("cms/sanity/studio-policy.ts", "utf8");
const studioConfig = readFileSync("sanity.config.ts", "utf8");

test("Ubersuggest provider remains local-authenticated and quota-conscious", () => {
  assert.match(provider, /\["development", "local-uat", "local-production"\]/);
  assert.match(provider, /PROVIDER_BATCH_MAX = 8/);
  assert.match(provider, /PROVIDER_TOOL_TIMEOUT_MS = 45_000/);
  assert.match(provider, /providerRequests|callUbersuggestTools|callTool/);
  assert.doesNotMatch(provider, /production-admin[^\n]*providerLaneAllowed/);
});

test("Ubersuggest account and GEO sync uses provider-reported limits", () => {
  assert.match(normalized, /name: "auth_status"/);
  assert.match(normalized, /name: "list_projects"/);
  assert.match(normalized, /name: "brand_config"/);
  assert.match(normalized, /name: "brand_visibility_overview"/);
  assert.match(normalized, /name: "brand_prompts"/);
  assert.match(normalized, /project\.limits\?\.keywords\?\.limit/);
  assert.match(normalized, /brandConfig\.limits\?\.prompts/);
  assert.match(normalized, /brandConfig\.limits\?\.brand_operations_limits/);
  assert.match(normalized, /remaining === 0 \? "full"/);
});

test("Ubersuggest snapshots contain no OAuth credentials and stay hidden from Studio", () => {
  assert.match(schema, /name: "ubersuggestAccountSnapshot"/);
  assert.match(schema, /name: "ubersuggestGeoSnapshot"/);
  assert.doesNotMatch(schema, /accessToken|refreshToken|access_token|refresh_token|clientSecret|client_secret/);
  assert.match(studioConfig, /\.\.\.ubersuggestSchemaTypes/);
  assert.match(studioPolicy, /"ubersuggestAccountSnapshot"/);
  assert.match(studioPolicy, /"ubersuggestGeoSnapshot"/);
});

test("Ubersuggest sync writes account GEO and audit atomically while reusing Sanity research history", () => {
  assert.match(snapshots, /getAdminSanityResearchWriteToken/);
  assert.match(snapshots, /transaction\(\)\.create\(accountDocument\)\.create\(geoDocument\)\.create\(auditDocument\)\.commit\(\)/);
  assert.match(snapshots, /_type == "researchSnapshot" && provider == "ubersuggest"/);
  assert.match(route, /SYNC_CACHE_HOURS = 1/);
  assert.match(route, /research:provider-query/);
  assert.match(route, /identity\.actorType !== "human"/);
  assert.match(route, /provider-sync-local-required/);
});

test("Admin exposes Ubersuggest quota GEO prompt gaps and research history", () => {
  assert.match(page, /Account Quota/);
  assert.match(page, /GEO \/ AEO — AI Search Visibility/);
  assert.match(page, /AI Prompt Gaps/);
  assert.match(page, /Research History/);
  assert.match(page, /admin\.ccpun\.com/);
  assert.match(page, /ไม่เก็บ OAuth token/);
  assert.match(page, /userVisibilityPercentage === 0/);
});
