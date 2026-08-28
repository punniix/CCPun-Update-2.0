import {
  frozenControlsForApply,
  getApplyableFieldPath,
  isAppliedSuggestionReplay,
} from "./suggestion-lifecycle";

type PatchBuilder = {
  ifRevisionId(revision: string): PatchBuilder;
  set(values: Record<string, unknown>): PatchBuilder;
};

type ReviewTransaction = {
  patch(id: string, update: (patch: PatchBuilder) => PatchBuilder): ReviewTransaction;
  create(document: Record<string, unknown>): ReviewTransaction;
  commit(): Promise<unknown>;
};

export type ReviewMutationClient = {
  transaction(): unknown;
};

function beginReviewTransaction(client: ReviewMutationClient) {
  return client.transaction() as ReviewTransaction;
}

function isRevisionConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { statusCode?: unknown; response?: { statusCode?: unknown } };
  return candidate.statusCode === 409 || candidate.response?.statusCode === 409;
}

async function commitOrConflict(transaction: ReviewTransaction) {
  try {
    await transaction.commit();
  } catch (error) {
    if (isRevisionConflict(error)) throw new Error("SUGGESTION_CONFLICT");
    throw error;
  }
}

export async function commitSuggestionApproval(
  client: ReviewMutationClient,
  input: {
    suggestionId: string;
    suggestionRevision: string;
    values: Record<string, unknown>;
    auditDocument: Record<string, unknown>;
  },
) {
  await commitOrConflict(
    beginReviewTransaction(client)
      .patch(input.suggestionId, (patch) => patch.ifRevisionId(input.suggestionRevision).set(input.values))
      .create(input.auditDocument),
  );
}

export async function commitSuggestionApplication(
  client: ReviewMutationClient,
  input: {
    draftId: string;
    draftRevision: string;
    fieldPath: string;
    value: string;
    suggestionId: string;
    suggestionRevision: string;
    suggestionValues: Record<string, unknown>;
    auditDocument: Record<string, unknown>;
  },
) {
  if (!input.draftId.startsWith("drafts.")) throw new Error("TARGET_DRAFT_REQUIRED");
  await commitOrConflict(
    beginReviewTransaction(client)
      .patch(input.draftId, (patch) => patch.ifRevisionId(input.draftRevision).set({ [input.fieldPath]: input.value }))
      .patch(input.suggestionId, (patch) => patch.ifRevisionId(input.suggestionRevision).set(input.suggestionValues))
      .create(input.auditDocument),
  );
}

export function appliedSuggestionReplay(input: {
  suggestionId: string;
  status: string;
  approvedAfter?: string | null;
  approvedType?: string | null;
  approvedRiskLevel?: string | null;
  approvedTargetId?: string | null;
  appliedAt?: string | null;
}) {
  if (!isAppliedSuggestionReplay(input.status)) return null;
  const controls = frozenControlsForApply(input);
  if (!controls || !input.approvedAfter || !input.appliedAt) throw new Error("SUGGESTION_APPROVAL_INCOMPLETE");
  const fieldPath = getApplyableFieldPath(controls.type);
  if (!fieldPath) throw new Error("SUGGESTION_TYPE_NOT_APPLYABLE");
  return {
    suggestionId: input.suggestionId,
    draftId: controls.targetId.startsWith("drafts.") ? controls.targetId : `drafts.${controls.targetId}`,
    fieldPath,
    before: null,
    after: input.approvedAfter,
    appliedAt: input.appliedAt,
    alreadyApplied: true,
  };
}
