import assert from "node:assert/strict";
import test from "node:test";
import {
  appliedSuggestionReplay,
  commitSuggestionApplication,
  commitSuggestionApproval,
  type ReviewMutationClient,
} from "../../lib/admin/sanity-review-mutations";

type Operation =
  | { type: "patch"; id: string; revision: string; values: Record<string, unknown> }
  | { type: "create"; document: Record<string, unknown> }
  | { type: "commit" };

function fakeClient(error?: unknown) {
  const operations: Operation[] = [];
  const transaction = {
    patch(id: string, update: (patch: { ifRevisionId(revision: string): unknown }) => unknown) {
      let revision = "";
      const patch = {
        ifRevisionId(value: string) {
          revision = value;
          return {
            set(values: Record<string, unknown>) {
              operations.push({ type: "patch", id, revision, values });
              return patch;
            },
          };
        },
      };
      update(patch);
      return transaction;
    },
    create(document: Record<string, unknown>) {
      operations.push({ type: "create", document });
      return transaction;
    },
    async commit() {
      operations.push({ type: "commit" });
      if (error) throw error;
    },
  };
  return { client: { transaction: () => transaction } as unknown as ReviewMutationClient, operations };
}

test("approval maps Sanity revision conflicts without losing its audit transaction", async () => {
  const conflict = fakeClient({ statusCode: 409 });
  await assert.rejects(
    commitSuggestionApproval(conflict.client, {
      suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
      suggestionRevision: "suggestion-rev-1",
      values: { status: "approved" },
      auditDocument: { _id: "drafts.auditLog.approve", _type: "auditLog" },
    }),
    /SUGGESTION_CONFLICT/,
  );
  assert.deepEqual(conflict.operations.map(({ type }) => type), ["patch", "create", "commit"]);
});

test("apply patches only the Draft and review record in one transaction", async () => {
  const fake = fakeClient();
  await commitSuggestionApplication(fake.client, {
    draftId: "drafts.article-1",
    draftRevision: "article-rev-1",
    fieldPath: "seo.title",
    value: "Reviewed title",
    suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
    suggestionRevision: "suggestion-rev-1",
    suggestionValues: { status: "applied" },
    auditDocument: { _id: "drafts.auditLog.apply", _type: "auditLog" },
  });

  assert.deepEqual(fake.operations, [
    { type: "patch", id: "drafts.article-1", revision: "article-rev-1", values: { "seo.title": "Reviewed title" } },
    { type: "patch", id: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef", revision: "suggestion-rev-1", values: { status: "applied" } },
    { type: "create", document: { _id: "drafts.auditLog.apply", _type: "auditLog" } },
    { type: "commit" },
  ]);
  assert.equal(fake.operations.some((operation) => "publish" in operation), false);
});

test("apply maps either Draft or suggestion revision conflict to a stable conflict", async () => {
  const conflict = fakeClient({ response: { statusCode: 409 } });
  await assert.rejects(
    commitSuggestionApplication(conflict.client, {
      draftId: "drafts.article-1",
      draftRevision: "stale-article-rev",
      fieldPath: "seo.title",
      value: "Reviewed title",
      suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
      suggestionRevision: "stale-suggestion-rev",
      suggestionValues: { status: "applied" },
      auditDocument: { _id: "drafts.auditLog.apply-conflict", _type: "auditLog" },
    }),
    /SUGGESTION_CONFLICT/,
  );
  assert.deepEqual(conflict.operations.map(({ type }) => type), ["patch", "patch", "create", "commit"]);
});

test("apply rejects a Published target before opening a transaction", async () => {
  const fake = fakeClient();
  await assert.rejects(
    commitSuggestionApplication(fake.client, {
      draftId: "article-1",
      draftRevision: "article-rev-1",
      fieldPath: "seo.title",
      value: "Unsafe title",
      suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
      suggestionRevision: "suggestion-rev-1",
      suggestionValues: { status: "applied" },
      auditDocument: { _id: "drafts.auditLog.apply", _type: "auditLog" },
    }),
    /TARGET_DRAFT_REQUIRED/,
  );
  assert.deepEqual(fake.operations, []);
});

test("an applied replay is idempotent and requires no mutation client", () => {
  assert.deepEqual(appliedSuggestionReplay({
    suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
    status: "applied",
    approvedAfter: "Reviewed title",
    approvedType: "seo-title",
    approvedRiskLevel: "low",
    approvedTargetId: "article-1",
    appliedAt: "2026-08-29T00:00:00.000Z",
  }), {
    suggestionId: "drafts.seoSuggestion.audit.0123456789abcdef0123456789abcdef",
    draftId: "drafts.article-1",
    fieldPath: "seo.title",
    before: null,
    after: "Reviewed title",
    appliedAt: "2026-08-29T00:00:00.000Z",
    alreadyApplied: true,
  });
});
