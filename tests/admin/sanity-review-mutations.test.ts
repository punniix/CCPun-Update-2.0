import assert from "node:assert/strict";
import test from "node:test";
import { appliedSuggestionReplay, patchArticleSeoField, type ArticlePatchClient } from "../../lib/admin/sanity-review-mutations";

function fakeClient(result: { _rev?: string } = { _rev: "article-rev-2" }) {
  const calls: unknown[] = [];
  const patch = {
    ifRevisionId(revision: string) { calls.push(["revision", revision]); return patch; },
    set(values: Record<string, unknown>) { calls.push(["set", values]); return patch; },
    async commit(options: { returnDocuments: true }) { calls.push(["commit", options]); return result; },
  };
  return { client: { patch(id: string) { calls.push(["patch", id]); return patch; } } as ArticlePatchClient, calls };
}

test("cross-store apply patches only the exact Sanity Article draft revision", async () => {
  const fake = fakeClient();
  const revision = await patchArticleSeoField(fake.client, {
    draftId: "drafts.article-1", draftRevision: "article-rev-1", fieldPath: "seo.title", value: "Reviewed title",
  });
  assert.equal(revision, "article-rev-2");
  assert.deepEqual(fake.calls, [
    ["patch", "drafts.article-1"], ["revision", "article-rev-1"],
    ["set", { "seo.title": "Reviewed title" }], ["commit", { returnDocuments: true }],
  ]);
});

test("cross-store apply rejects published targets and ambiguous Sanity results", async () => {
  const fake = fakeClient({});
  await assert.rejects(patchArticleSeoField(fake.client, {
    draftId: "article-1", draftRevision: "rev", fieldPath: "seo.title", value: "x",
  }), /TARGET_DRAFT_REQUIRED/);
  await assert.rejects(patchArticleSeoField(fake.client, {
    draftId: "drafts.article-1", draftRevision: "rev", fieldPath: "seo.title", value: "x",
  }), /SANITY_MUTATION_RESULT_AMBIGUOUS/);
});

test("cross-store apply accepts only the four exact supported SEO field paths", async () => {
  for (const fieldPath of ["seo.title", "seo.description", "seo.focusKeyword", "seo.searchIntent"]) {
    await patchArticleSeoField(fakeClient().client, { draftId: "drafts.article-1", draftRevision: "rev", fieldPath, value: "x" });
  }
  for (const fieldPath of ["seo", "seo.ogTitle", "seo.title.extra", "seo.__proto__"]) {
    await assert.rejects(patchArticleSeoField(fakeClient().client, {
      draftId: "drafts.article-1", draftRevision: "rev", fieldPath, value: "x",
    }), /SEO_FIELD_REQUIRED/);
  }
});

test("an applied replay is idempotent and performs no mutation", () => {
  assert.deepEqual(appliedSuggestionReplay({
    suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
    status: "applied", approvedAfter: "Reviewed title", approvedType: "seo-title", approvedRiskLevel: "low",
    approvedTargetId: "article-1", appliedAt: "2026-08-29T00:00:00.000Z",
  }), {
    suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
    draftId: "drafts.article-1", fieldPath: "seo.title", before: null, after: "Reviewed title",
    appliedAt: "2026-08-29T00:00:00.000Z", alreadyApplied: true,
  });
});
