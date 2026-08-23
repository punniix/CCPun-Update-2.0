import assert from "node:assert/strict";
import test from "node:test";
import {
  approvedBaseIsCurrent,
  canApplySuggestion,
  canApproveSuggestion,
  deterministicAuditSuggestionId,
  frozenControlsForApply,
  isHumanReviewActor,
  isCompatibleReviewSuggestion,
  isStaleSuggestionRevision,
  workflowDocumentId,
} from "../../lib/admin/suggestion-lifecycle";

test("approval and apply accept human actors only", () => {
  assert.equal(isHumanReviewActor("human"), true);
  assert.equal(isHumanReviewActor("ai"), false);
  assert.equal(isHumanReviewActor("system"), false);
});

test("proposal lifecycle never moves a replayed state backward", () => {
  assert.equal(canApproveSuggestion("needs-human-review"), true);
  assert.equal(canApproveSuggestion("approved"), false);
  assert.equal(canApproveSuggestion("applied"), false);
  assert.equal(canApplySuggestion("approved"), true);
  assert.equal(canApplySuggestion("needs-human-review"), false);
  assert.equal(canApplySuggestion("applied"), false);
});

test("approved base requires both the same revision and field value", () => {
  const base = { currentRevision: "rev-1", approvedRevision: "rev-1", currentValue: "old", approvedBaseValue: "old" };
  assert.equal(approvedBaseIsCurrent(base), true);
  assert.equal(approvedBaseIsCurrent({ ...base, currentRevision: "rev-2" }), false);
  assert.equal(approvedBaseIsCurrent({ ...base, currentValue: "edited" }), false);
  assert.equal(approvedBaseIsCurrent({ ...base, currentValue: undefined, approvedBaseValue: null }), true);
});

test("review queue treats missing or changed target revisions as stale", () => {
  assert.equal(isStaleSuggestionRevision("rev-2", "rev-2"), false);
  assert.equal(isStaleSuggestionRevision("rev-1", "rev-2"), true);
  assert.equal(isStaleSuggestionRevision(null, "rev-2"), true);
});

test("review queue contains only current proposals with complete approval controls", () => {
  const current = { targetRevision: "rev-2", targetCurrentRevision: "rev-2" };
  assert.equal(isCompatibleReviewSuggestion({ status: "needs-human-review", ...current }), true);
  assert.equal(isCompatibleReviewSuggestion({ status: "needs-human-review", ...current, targetRevision: "rev-1" }), false);
  assert.equal(isCompatibleReviewSuggestion({ status: "applied", ...current }), false);
  assert.equal(isCompatibleReviewSuggestion({
    status: "approved",
    approvedAfter: "new",
    approvedType: "seo-title",
    approvedRiskLevel: "low",
    approvedTargetId: "article-1",
    approvedTargetRevision: "rev-2",
    targetCurrentRevision: "rev-2",
  }), true);
  assert.equal(isCompatibleReviewSuggestion({
    status: "approved",
    approvedAfter: "new",
    approvedType: "seo-title",
    approvedRiskLevel: "low",
    approvedTargetId: "article-1",
    approvedTargetRevision: "rev-1",
    targetCurrentRevision: "rev-2",
  }), false);
});

test("audit proposal id is stable per draft revision and proposal type", () => {
  const input = { draftId: "drafts.article-1", revision: "rev-1", type: "seo-title" };
  const first = deterministicAuditSuggestionId(input);
  assert.equal(first, deterministicAuditSuggestionId(input));
  assert.notEqual(first, deterministicAuditSuggestionId({ ...input, revision: "rev-2" }));
  assert.notEqual(first, deterministicAuditSuggestionId({ ...input, type: "meta-description" }));
  assert.match(first, /^seoSuggestion\.audit\.[a-f0-9]{32}$/);
});

test("Local Production workflow documents stay Draft-only", () => {
  assert.equal(workflowDocumentId("seoSuggestion.audit.abc", true), "drafts.seoSuggestion.audit.abc");
  assert.equal(workflowDocumentId("drafts.auditLog.abc", true), "drafts.auditLog.abc");
  assert.equal(workflowDocumentId("drafts.auditLog.abc", false), "auditLog.abc");
});

test("apply uses the approved type even if the live type is tampered", () => {
  const live = { type: "primary-keyword" };
  const frozen = frozenControlsForApply({ approvedType: "seo-title", approvedRiskLevel: "low", approvedTargetId: "article-1" });
  assert.equal(live.type, "primary-keyword");
  assert.equal(frozen?.type, "seo-title");
});

test("apply uses the approved risk even if the live risk is lowered", () => {
  const live = { riskLevel: "low" };
  const frozen = frozenControlsForApply({ approvedType: "seo-title", approvedRiskLevel: "high", approvedTargetId: "article-1" });
  assert.equal(live.riskLevel, "low");
  assert.equal(frozen?.riskLevel, "high");
});

test("apply uses the approved target even if the live reference is redirected", () => {
  const live = { targetId: "article-2" };
  const frozen = frozenControlsForApply({ approvedType: "seo-title", approvedRiskLevel: "low", approvedTargetId: "article-1" });
  assert.equal(live.targetId, "article-2");
  assert.equal(frozen?.targetId, "article-1");
});
