import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const researchService = readFileSync(new URL("../../lib/admin/research.ts", import.meta.url), "utf8");
const seoAuditService = readFileSync(new URL("../../lib/admin/seo-audit.ts", import.meta.url), "utf8");
const seoAiService = readFileSync(new URL("../../lib/admin/seo-ai.ts", import.meta.url), "utf8");
const contentReadinessService = readFileSync(new URL("../../lib/admin/content-readiness.ts", import.meta.url), "utf8");
const researchRoute = readFileSync(new URL("../../app/api/snt-admin/research/route.ts", import.meta.url), "utf8");
const seoAuditRoute = readFileSync(new URL("../../app/api/snt-admin/seo/audit/[id]/route.ts", import.meta.url), "utf8");
const proposalRoute = readFileSync(new URL("../../app/api/snt-admin/seo/audit/[id]/proposals/route.ts", import.meta.url), "utf8");
const sanityControl = readFileSync(new URL("../../lib/admin/sanity-control.ts", import.meta.url), "utf8");
const studioScore = readFileSync(new URL("../../cms/sanity/components/SeoScoreInput.tsx", import.meta.url), "utf8");
const seoDetailPage = readFileSync(new URL("../../app/snt-admin/(protected)/seo/[id]/page.tsx", import.meta.url), "utf8");

test("research and persisted SEO audit mutations commit their audit document atomically", () => {
  assert.match(
    researchService,
    /transaction\.create\(snapshotDocument\)\.create\(auditDocument\)\.commit\(\)/,
  );
  assert.match(researchService, /transaction\.createIfNotExists\(snapshotDocument\)\.createIfNotExists\(auditDocument\)\.commit\(\)/);
  assert.match(
    seoAuditService,
    /transaction\(\)\.patch\([\s\S]+\)\.create\(auditDocument\)\.commit\(\)/,
  );
  assert.match(seoAuditService, /patch\.ifRevisionId\(article\.revision\)/);
  assert.doesNotMatch(researchRoute, /appendAuditLog/);
  assert.doesNotMatch(seoAuditRoute, /appendAuditLog/);
});

test("audits and generated proposals stay bound to one article revision", () => {
  assert.match(seoAuditService, /"revision": _rev/);
  assert.match(seoAuditService, /patch\.ifRevisionId\(article\.revision\)/);
  assert.match(proposalRoute, /audit\.sourceRevision !== generated\.sourceRevision/);
  assert.match(proposalRoute, /expectedTargetRevision: audit\.sourceRevision/);
  assert.match(sanityControl, /target\._rev !== context\.expectedTargetRevision/);
  assert.match(seoAuditService, /!article\.id\.startsWith\("drafts\."\).*SEO_AUDIT_DRAFT_REQUIRED/);
});

test("Studio displays the canonical saved audit instead of recomputing a second score", () => {
  assert.match(studioScore, /props\.value\?\.auditSnapshot/);
  assert.match(studioScore, /ผลตรวจ SEO ล่าสุดที่บันทึก/);
  assert.doesNotMatch(studioScore, /const checks|rawScore|useFormValue/);
});

test("content readiness is read-only and remains separate from the SEO score", () => {
  assert.match(seoAuditService, /contentReadiness:/);
  assert.match(contentReadinessService, /legacyInternalLinks/);
  assert.match(contentReadinessService, /legacyFacebookCtas/);
  assert.match(contentReadinessService, /geoCompleted/);
  assert.match(seoDetailPage, /ส่วนนี้เป็นรายการตรวจสำหรับคนทำงาน ไม่รวมในคะแนน SEO/);
  assert.match(seoDetailPage, /เปิดแก้ใน Studio/);
});

test("automatic metadata proposals require evidence and human review while GSC remains deferred", () => {
  assert.match(seoAiService, /PRIMARY_KEYWORD_REQUIRED/);
  assert.match(seoAiService, /SEO_RESEARCH_REQUIRED/);
  assert.match(seoAiService, /KEYWORD_OWNER_CONFLICT/);
  assert.match(seoAiService, /getSeoResearchEvidence/);
  assert.match(seoAiService, /searchIntentOwnerRegistry/);
  assert.match(proposalRoute, /generateEvidenceBasedSeoProposals/);
  assert.match(proposalRoute, /actorType: "ai"/);
  assert.match(proposalRoute, /idempotentForAuditRevision: true/);
  assert.match(seoDetailPage, /Research Snapshot\/SERP/);
  assert.match(seoDetailPage, /Search Intent Owner/);
  assert.match(seoDetailPage, /Human Review/);
  assert.match(seoDetailPage, /GSC: Phase ถัดไป/);
  assert.match(seoDetailPage, /OPENAI_API_KEY/);
  assert.doesNotMatch(proposalRoute, /approveSeoSuggestion|applySeoSuggestion|publishArticle/);
});
