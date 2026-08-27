import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeAuditJson } from "../../lib/admin/audit-sanitizer";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("audit before/after keeps only approved fields and drops credential-shaped data", () => {
  const serialized = safeAuditJson({
    status: "approved",
    field: "seo.title",
    valuePresent: true,
    value: "Draft SEO content must not be logged",
    token: "token-value",
    secret: "secret-value",
    cookie: "cookie-value",
    authorization: "Bearer credential",
    keyword: "customer@example.com token=keyword-secret",
    domain: "customer-account.example",
    opportunities: "Bearer provider-response",
    rawProviderResponse: { accessToken: "nested-token", result: "raw" },
  });

  assert.deepEqual(JSON.parse(serialized ?? "null"), {
    status: "approved",
    field: "seo.title",
    valuePresent: true,
  });
  assert.equal(safeAuditJson({ unknown: "raw", token: "secret" }), undefined);
  assert.equal(safeAuditJson("raw unknown payload"), undefined);
});

test("approve and apply validate bounded Sanity document IDs before data access", () => {
  const source = read("lib/admin/sanity-control.ts");
  const approveRoute = read("app/api/snt-admin/reviews/[id]/approve/route.ts");
  const applyRoute = read("app/api/snt-admin/reviews/[id]/apply/route.ts");
  assert.match(source, /const documentIdSchema = z\.string\(\)\.min\(1\)\.max\(200\)\.regex\(\/\^\[A-Za-z0-9_\.\-\]\+\$\/\)/);
  assert.match(source, /suggestionDocumentIdSchema = documentIdSchema\.regex\([\s\S]*?seoSuggestion/);
  assert.match(source, /approveSeoSuggestion[\s\S]*?const parsedId = parseSuggestionDocumentId\(input\.id\);[\s\S]*?requireWriteClient\(\)/);
  assert.match(source, /applyApprovedSeoSuggestion[\s\S]*?const parsedId = parseSuggestionDocumentId\(input\.id\);[\s\S]*?requireWriteClient\(\)/);
  assert.doesNotMatch(source, /workflowDocumentId\(z\.string\(\)\.min\(1\)\.parse\(input\.id\)/);
  assert.match(approveRoute, /INVALID_SUGGESTION_ID[\s\S]*?invalid-suggestion-id[\s\S]*?status: 400/);
  assert.match(applyRoute, /INVALID_SUGGESTION_ID[\s\S]*?invalid-suggestion-id[\s\S]*?status: 400/);
});

test("Preview disable is a same-origin POST and every current caller uses POST", () => {
  const route = read("app/api/preview/disable/route.ts");
  const proxy = read("proxy.ts");
  const article = read("app/blog/[category]/[slug]/page.tsx");
  const qa = read("qa/blog-uat-regression.mjs");
  const sanityConfig = read("sanity.config.ts");

  assert.match(route, /export async function POST\(request: Request\)/);
  assert.doesNotMatch(route, /export async function GET/);
  assert.match(route, /NextResponse\.redirect\([^;]+, 303\)/);
  assert.match(proxy, /\(isAdminApi \|\| isPreviewApi\)[\s\S]*?!\["GET", "HEAD", "OPTIONS"\]\.includes\(request\.method\)/);
  assert.match(article, /<form action="\/api\/preview\/disable\/" method="post">/);
  assert.match(qa, /const disableResponse = await evaluate[\s\S]*?fetch\(["']\/api\/preview\/disable\/["'], \{ method: ["']POST["'] \}\)/);
  assert.match(qa, /!disableResponse\?\.ok \|\| disableResponse\.pathname !== ["']\/blog\/["']/);
  assert.doesNotMatch(sanityConfig, /disable:\s*["']\/api\/preview\/disable/);
});
