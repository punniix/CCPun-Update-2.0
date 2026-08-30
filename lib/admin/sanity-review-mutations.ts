import { frozenControlsForApply, getApplyableFieldPath, isAppliedSuggestionReplay } from "./suggestion-lifecycle";

type SanityPatch = {
  ifRevisionId(revision: string): SanityPatch;
  set(values: Record<string, unknown>): SanityPatch;
  commit(options: { returnDocuments: true }): Promise<{ _rev?: string }>;
};

export type ArticlePatchClient = {
  patch(id: string): SanityPatch;
};

const ALLOWED_SEO_PATCH_PATHS = new Set(["seo.title", "seo.description", "seo.focusKeyword", "seo.searchIntent"]);

export async function patchArticleSeoField(
  client: ArticlePatchClient,
  input: { draftId: string; draftRevision: string; fieldPath: string; value: string },
) {
  if (!input.draftId.startsWith("drafts.")) throw new Error("TARGET_DRAFT_REQUIRED");
  if (!ALLOWED_SEO_PATCH_PATHS.has(input.fieldPath)) throw new Error("SEO_FIELD_REQUIRED");
  const document = await client.patch(input.draftId)
    .ifRevisionId(input.draftRevision)
    .set({ [input.fieldPath]: input.value })
    .commit({ returnDocuments: true });
  if (!document._rev) throw new Error("SANITY_MUTATION_RESULT_AMBIGUOUS");
  return document._rev;
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
