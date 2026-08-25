import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("SEO AI proposals stay evidence-gated and human-reviewed", () => {
  const ai = readFileSync("lib/admin/seo-ai.ts", "utf8");
  const route = readFileSync("app/api/snt-admin/seo/audit/[id]/proposals/route.ts", "utf8");
  const detailPage = readFileSync("app/snt-admin/(protected)/seo/[id]/page.tsx", "utf8");
  const button = readFileSync("components/admin/GenerateSeoSuggestionsButton.tsx", "utf8");
  const research = readFileSync("lib/admin/research.ts", "utf8");
  const vercelIgnore = readFileSync(".vercelignore", "utf8");

  assert.match(ai, /search-intent-owner-registry\.json/);
  assert.match(ai, /OPENAI_API_KEY/);
  assert.match(ai, /CCPUN_SEO_AI_MODEL/);
  assert.match(ai, /gpt-5\.6-terra/);
  assert.match(ai, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(ai, /getSeoResearchEvidence/);
  assert.match(ai, /PRIMARY_KEYWORD_REQUIRED/);
  assert.match(ai, /SEO_RESEARCH_REQUIRED/);
  assert.match(ai, /KEYWORD_OWNER_CONFLICT/);
  assert.match(ai, /untrusted data/);
  assert.match(ai, /store: false/);
  assert.match(ai, /same reviewed query/i);
  assert.match(ai, /riskLevel: "medium"/);
  assert.doesNotMatch(ai, /canonical[^\n]*after|noindex[^\n]*after|category[^\n]*after|slug[^\n]*after/);

  assert.match(vercelIgnore, /qa\/\*/);
  assert.match(vercelIgnore, /!qa\/search-intent-owner-registry\.json/);

  assert.match(research, /export async function getSeoResearchEvidence/);
  assert.match(research, /checkedAt >= \$freshAfter/);

  assert.match(route, /generateEvidenceBasedSeoProposals/);
  assert.match(route, /actorType: "ai"/);
  assert.match(route, /createdBy: "ccpun-seo-ai"/);
  assert.match(route, /idempotentForAuditRevision: true/);
  assert.match(route, /expectedTargetRevision: audit\.sourceRevision/);

  assert.match(detailPage, /AI SEO Suggestions/);
  assert.match(detailPage, /Human Review/);
  assert.match(detailPage, /GSC: Phase ถัดไป/);
  assert.match(button, /จะไม่แก้หรือเผยแพร่บทความเอง/);
  assert.match(button, /\/snt-admin\/reviews\//);
});
