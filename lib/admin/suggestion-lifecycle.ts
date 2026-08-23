import { createHash } from "node:crypto";

export const applyableSeoFieldPaths = {
  "seo-title": "seo.title",
  "meta-description": "seo.description",
  "primary-keyword": "seo.focusKeyword",
  "search-intent": "seo.searchIntent",
} as const;

export type ApplyableSuggestionType = keyof typeof applyableSeoFieldPaths;

export function getApplyableFieldPath(type: string) {
  return applyableSeoFieldPaths[type as ApplyableSuggestionType] ?? null;
}

export function canApproveSuggestion(status: string) {
  return status === "needs-human-review";
}

export function canApplySuggestion(status: string) {
  return status === "approved";
}

export function isHumanReviewActor(actorType: string) {
  return actorType === "human";
}

export function isStaleSuggestionRevision(targetRevision: string | null | undefined, currentRevision: string | null | undefined) {
  return !targetRevision || !currentRevision || targetRevision !== currentRevision;
}

export function isCompatibleReviewSuggestion(input: {
  status?: string | null;
  targetRevision?: string | null;
  approvedTargetRevision?: string | null;
  targetCurrentRevision?: string | null;
  approvedAfter?: string | null;
  approvedType?: string | null;
  approvedRiskLevel?: string | null;
  approvedTargetId?: string | null;
}) {
  if (input.status === "needs-human-review") {
    return !isStaleSuggestionRevision(input.targetRevision, input.targetCurrentRevision);
  }

  if (input.status !== "approved") return false;
  return Boolean(
    input.approvedAfter &&
    input.approvedType &&
    input.approvedRiskLevel &&
    input.approvedTargetId &&
    !isStaleSuggestionRevision(input.approvedTargetRevision, input.targetCurrentRevision),
  );
}

export function storedFieldValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function approvedBaseIsCurrent(input: {
  currentRevision: string;
  approvedRevision: string;
  currentValue: unknown;
  approvedBaseValue: string | null;
}) {
  return input.currentRevision === input.approvedRevision
    && storedFieldValue(input.currentValue) === input.approvedBaseValue;
}

export function frozenControlsForApply(input: {
  approvedType?: string | null;
  approvedRiskLevel?: string | null;
  approvedTargetId?: string | null;
}) {
  if (!input.approvedType || !input.approvedRiskLevel || !input.approvedTargetId) return null;
  return {
    type: input.approvedType,
    riskLevel: input.approvedRiskLevel,
    targetId: input.approvedTargetId,
  };
}

export function deterministicAuditSuggestionId(input: {
  draftId: string;
  revision: string;
  type: string;
}) {
  const key = `${input.draftId}\u0000${input.revision}\u0000${input.type}`;
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 32);
  return `seoSuggestion.audit.${digest}`;
}

export function workflowDocumentId(id: string, draftOnly: boolean) {
  const cleanId = id.replace(/^drafts\./, "");
  return draftOnly ? `drafts.${cleanId}` : cleanId;
}
