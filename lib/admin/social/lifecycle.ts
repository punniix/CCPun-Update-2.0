import { createHash } from "node:crypto";
import { z } from "zod";

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const revision = z.string().trim().min(1).max(120);

const approvalInputSchema = z.object({
  variantId: boundedId,
  approvedRevision: revision,
  approvedVersion: z.number().int().min(1),
  approvedByActorType: z.literal("human"),
  currentRevision: revision,
  currentVersion: z.number().int().min(1),
  existingPublication: z.object({
    publicationId: boundedId,
    idempotencyKey: z.string().min(16).max(200),
  }).nullable(),
});

export function publicationIdempotencyKey(input: {
  variantId: string;
  approvedRevision: string;
  approvedVersion: number;
}) {
  return `publication:${createHash("sha256")
    .update(`${input.variantId}\0${input.approvedRevision}\0${input.approvedVersion}`)
    .digest("hex")}`;
}

export function planApprovedPublication(input: z.input<typeof approvalInputSchema>) {
  const approved = approvalInputSchema.parse(input);
  const idempotencyKey = publicationIdempotencyKey(approved);
  const result = (state: "ready" | "replay" | "conflict", publicationId: string | null, reason: string) => ({
    state,
    publicationId,
    approvedRevision: approved.approvedRevision,
    approvedVersion: approved.approvedVersion,
    idempotencyKey,
    initialStatus: state === "ready" ? "approved" as const : null,
    providerWriteAllowed: false as const,
    reason,
  });

  if (approved.currentRevision !== approved.approvedRevision || approved.currentVersion !== approved.approvedVersion) {
    return result("conflict", null, "Current revision or version differs from the human-approved content");
  }
  if (approved.existingPublication?.idempotencyKey === idempotencyKey) {
    return result("replay", approved.existingPublication.publicationId, "Reuse the existing idempotent publication");
  }
  if (approved.existingPublication) {
    return result("conflict", approved.existingPublication.publicationId, "Another publication already owns this variant lifecycle");
  }
  return result("ready", `publication:${idempotencyKey.slice(-32)}`, "Create one operational publication in approved state");
}
