import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSocialExportSheets, createSocialGoogleSpreadsheet } from "../../lib/admin/social/sheets-export";

const now = new Date("2026-09-01T05:00:00.000Z");
const authorization = {
  scope: "https://www.googleapis.com/auth/drive.file",
  mode: "owner-interactive",
  tokenPersistence: "memory-only",
  refreshTokenPersistence: "forbidden",
  issuedAtMs: now.getTime() - 1_000,
  expiresAtMs: now.getTime() + 3_000_000,
} as const;

test("Sheets export separates Content, Publications and every platform-native metric", () => {
  const sheets = buildSocialExportSheets({
    contents: [{ record_type: "current", content_id: "content:1", provider: "meta", platform: "facebook", provider_account_id: "page:1",
      provider_object_id: "post:1", linked_publication_id: "publication:1", published_at: now, captured_at: now,
      text_content: "=not-a-formula", media_type: "text", permalink_url: null, thumbnail_url: null, first_seen_at: now, last_seen_at: now }],
    publications: [{ publication_id: "publication:1", variant_id: "variant:1", master_content_id: "master:1", channel: "facebook",
      format: "text-post", publishing_mode: "native-scheduled", editorial_revision: "revision:1", editorial_version: 1,
      status: "published", execution_target: "facebook-native-scheduled", scheduled_at: now, platform_object_id: "post:1",
      published_at: now, created_at: now, updated_at: now, job_id: "job:1", job_type: "publish", job_status: "succeeded",
      job_version: 1, attempt_count: 1 }],
    metrics: [{ source: "provider-content", source_id: "snapshot:1", content_id: "content:1", publication_id: null,
      provider: "meta", platform: "facebook", platform_object_id: "post:1", fetched_at: now, limitations: [],
      native_metrics: [
        { key: "facebook.reactions", label: "Reactions", value: 12, unit: "count", dimension: "engagement" },
        { key: "facebook.comments", label: "Comments", value: 4, unit: "count", dimension: "engagement" },
      ] }],
  });
  assert.deepEqual(sheets.map((sheet) => sheet.title), ["Content", "Publications", "Facebook - Comments", "Facebook - Reactions"]);
  assert.equal(sheets[0]?.rows[1]?.[9], "=not-a-formula");
  assert.equal(sheets[2]?.rows.length, 2);
});

test("Sheets REST uses one memory-only drive.file token, blocks redirects and never writes it into a request body", async () => {
  const calls: Array<{ url: string; authorization: string; body: string; redirect: RequestRedirect | undefined }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), authorization: String(new Headers(init?.headers).get("authorization")), body: String(init?.body ?? ""), redirect: init?.redirect });
    return calls.length === 1
      ? new Response(JSON.stringify({ spreadsheetId: "sheet_export_20260901" }), { status: 200 })
      : new Response("{}", { status: 200 });
  };
  const result = await createSocialGoogleSpreadsheet({
    accessToken: "synthetic_access_token_never_persist",
    authorization,
    sheets: [{ title: "Content", rows: [["id"], ["content:1"]] }, { title: "Publications", rows: [["id"]] }],
    nowMs: now.getTime(),
    fetcher,
  });
  assert.equal(result.spreadsheetUrl, "https://docs.google.com/spreadsheets/d/sheet_export_20260901/edit");
  assert.ok(calls.every((call) => call.authorization === "Bearer synthetic_access_token_never_persist"));
  assert.ok(calls.every((call) => !call.body.includes("synthetic_access_token_never_persist")));
  assert.ok(calls.every((call) => call.redirect === "error"));
  assert.match(calls[1]!.url, /valueInputOption=RAW$/);
});

test("Sheets export rejects expired interactive authorization before any Google call", async () => {
  let called = false;
  await assert.rejects(() => createSocialGoogleSpreadsheet({
    accessToken: "synthetic_access_token",
    authorization: { ...authorization, expiresAtMs: now.getTime() },
    sheets: [{ title: "Content", rows: [["id"]] }, { title: "Publications", rows: [["id"]] }],
    nowMs: now.getTime(),
    fetcher: async () => { called = true; return new Response(); },
  }), /GOOGLE_SHEETS_AUTH_REQUIRED/);
  assert.equal(called, false);
});

test("Sheets route is an owner-only same-origin UAT mutation and the UI keeps the token in memory", () => {
  const route = readFileSync(new URL("../../app/api/snt-admin/social/export/sheets/route.ts", import.meta.url), "utf8");
  const service = readFileSync(new URL("../../lib/admin/social/sheets-export.ts", import.meta.url), "utf8");
  const component = readFileSync(new URL("../../features/admin/social/SocialSheetsExport.tsx", import.meta.url), "utf8");
  assert.match(route, /identity\.actorType !== "human" \|\| identity\.role !== "owner"/);
  assert.match(route, /isConfiguredAdminOrigin/);
  assert.match(route, /isSameOriginAdminMutation/);
  assert.match(service, /isSocialPublicationApprovalEnabled/);
  assert.match(service, /CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED/);
  assert.match(component, /useRef<GoogleDriveMemorySession \| null>/);
  assert.doesNotMatch(component, /localStorage|sessionStorage|indexedDB|cookie/i);
  assert.doesNotMatch(route, /console\./);
  assert.doesNotMatch(service, /console\./);
});
